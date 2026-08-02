"use client";

import { useState, useEffect } from "react";
import { adminFetch } from "@/lib/adminFetch";
import ExportButton from "@/components/admin/ExportButton";

export default function ShopPage() {
  const [activeTab, setActiveTab] = useState("products");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    category_id: "",
    price: "",
    discount_price: "",
    image: null,
    brand: "",
    stock: "",
    is_active: true,
  });

  const [categoryForm, setCategoryForm] = useState({
    name: "",
    slug: "",
    icon: "",
    sort_order: 0,
  });
  const [editingCategory, setEditingCategory] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        adminFetch("/api/admin/shop?type=products&includeInactive=true"),
        adminFetch("/api/admin/shop?type=categories&includeInactive=true"),
      ]);
      const prodData = await prodRes.json();
      const catData = await catRes.json();
      setProducts(prodData.data || []);
      setCategories(catData.data || []);
    } catch (err) {
      console.error("Failed to fetch shop data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const brands = [...new Set(products.map((p) => p.brand).filter(Boolean))];

  const filteredProducts = products.filter((p) => {
    const matchSearch =
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase()) ||
      p.brand?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !filterCategory || p.category_id?.toString() === filterCategory;
    const matchBrand = !filterBrand || p.brand === filterBrand;
    return matchSearch && matchCategory && matchBrand;
  });

  const filteredCategories = categories.filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase())
  );

  const openCreateProduct = () => {
    setEditing(null);
    setProductForm({
      name: "",
      description: "",
      category_id: "",
      price: "",
      discount_price: "",
      image: null,
      brand: "",
      stock: "",
      is_active: true,
    });
    setModalOpen(true);
  };

  const openEditProduct = (p) => {
    setEditing(p);
    setProductForm({
      name: p.name || "",
      description: p.description || "",
      category_id: p.category_id || "",
      price: p.price || "",
      discount_price: p.discount_price || "",
      image: null,
      brand: p.brand || "",
      stock: p.stock ?? "",
      is_active: p.is_active !== false,
    });
    setModalOpen(true);
  };

  const handleSaveProduct = async () => {
    setSaving(true);
    try {
      const payload = {
        name: productForm.name,
        description: productForm.description,
        category_id: productForm.category_id || null,
        price: Number(productForm.price) || 0,
        stock: Number(productForm.stock) || 0,
        brand: productForm.brand || null,
        discount_price: Number(productForm.discount_price) || null,
        is_active: productForm.is_active,
      };

      const url = "/api/admin/shop";
      const method = editing ? "PUT" : "POST";
      const body = editing ? { id: editing.id, ...payload } : payload;

      await adminFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setModalOpen(false);
      fetchData();
    } catch (err) {
      console.error("Failed to save product:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    try {
      await adminFetch(`/api/admin/shop?type=product&id=${id}`, { method: "DELETE" });
      setDeleteConfirm(null);
      fetchData();
    } catch (err) {
      console.error("Failed to delete product:", err);
    }
  };

  const handleSaveCategory = async () => {
    setSaving(true);
    try {
      const payload = {
        type: 'category',
        name: categoryForm.name,
        slug: categoryForm.slug || categoryForm.name.toLowerCase().replace(/\s+/g, "-"),
        description: null,
        icon: categoryForm.icon || null,
        sort_order: parseInt(categoryForm.sort_order) || 0,
      };

      const url = "/api/admin/shop";
      const method = editingCategory ? "PUT" : "POST";
      const body = editingCategory ? { id: editingCategory.id, ...payload } : payload;

      await adminFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setCategoryForm({ name: "", slug: "", icon: "", sort_order: 0 });
      setEditingCategory(null);
      fetchData();
    } catch (err) {
      console.error("Failed to save category:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    try {
      await adminFetch(`/api/admin/shop?type=category&id=${id}`, { method: "DELETE" });
      fetchData();
    } catch (err) {
      console.error("Failed to delete category:", err);
    }
  };

  const getCategoryName = (id) => {
    const cat = categories.find((c) => c.id?.toString() === id?.toString());
    return cat?.name || "Uncategorized";
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#1B5E20] flex items-center gap-3">
              <span className="material-symbols-rounded text-4xl">storefront</span>
              Shop Management
            </h1>
            <p className="text-gray-500 mt-1">Manage products and categories for your padel store</p>
          </div>
        </div>

        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
          <button
            onClick={() => setActiveTab("products")}
            className={`px-6 py-2.5 rounded-lg text-sm font-medium transition ${
              activeTab === "products"
                ? "bg-white text-[#1B5E20] shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <span className="material-symbols-rounded text-lg align-middle mr-1.5">inventory_2</span>
            Products
          </button>
          <button
            onClick={() => setActiveTab("categories")}
            className={`px-6 py-2.5 rounded-lg text-sm font-medium transition ${
              activeTab === "categories"
                ? "bg-white text-[#1B5E20] shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <span className="material-symbols-rounded text-lg align-middle mr-1.5">label</span>
            Categories
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-[250px]">
              <span className="material-symbols-rounded absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                search
              </span>
              <input
                type="text"
                placeholder={activeTab === "products" ? "Search products..." : "Search categories..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1B5E20] focus:border-transparent outline-none"
              />
            </div>
            {activeTab === "products" && (
              <>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1B5E20] outline-none"
                >
                  <option value="">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <select
                  value={filterBrand}
                  onChange={(e) => setFilterBrand(e.target.value)}
                  className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1B5E20] outline-none"
                >
                  <option value="">All Brands</option>
                  {brands.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
                <ExportButton
                  data={filteredProducts}
                  filename="products"
                  columns={[
                    { header: "Name", key: "name" },
                    { header: "Category", key: "category_id", format: (v) => getCategoryName(v) },
                    { header: "Price", key: "price" },
                    { header: "Discount Price", key: "discount_price" },
                    { header: "Stock", key: "stock" },
                    { header: "Brand", key: "brand" },
                    { header: "Status", key: "is_active", format: (v) => (v ? "Active" : "Inactive") },
                  ]}
                />
              </>
            )}
            {activeTab === "categories" && (
              <ExportButton
                data={filteredCategories}
                filename="categories"
                columns={[
                  { header: "Name", key: "name" },
                  { header: "Slug", key: "slug" },
                  { header: "Icon", key: "icon" },
                  { header: "Sort Order", key: "sort_order" },
                ]}
              />
            )}
          </div>
        </div>

        {activeTab === "categories" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
            <h3 className="font-bold text-gray-800 mb-3">
              {editingCategory ? "Edit Category" : "Add Category"}
            </h3>
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[150px]">
                <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1B5E20] outline-none text-sm"
                  placeholder="Category name"
                />
              </div>
              <div className="w-32">
                <label className="block text-xs font-medium text-gray-500 mb-1">Slug</label>
                <input
                  type="text"
                  value={categoryForm.slug}
                  onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1B5E20] outline-none text-sm"
                  placeholder="auto"
                />
              </div>
              <div className="w-24">
                <label className="block text-xs font-medium text-gray-500 mb-1">Icon</label>
                <input
                  type="text"
                  value={categoryForm.icon}
                  onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1B5E20] outline-none text-sm"
                  placeholder="icon"
                />
              </div>
              <div className="w-20">
                <label className="block text-xs font-medium text-gray-500 mb-1">Order</label>
                <input
                  type="number"
                  value={categoryForm.sort_order}
                  onChange={(e) => setCategoryForm({ ...categoryForm, sort_order: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1B5E20] outline-none text-sm"
                  min="0"
                />
              </div>
              <button
                onClick={handleSaveCategory}
                disabled={!categoryForm.name || saving}
                className="px-5 py-2 bg-[#1B5E20] text-white rounded-xl hover:bg-[#2E7D32] transition text-sm font-medium disabled:opacity-50"
              >
                {saving ? "..." : editingCategory ? "Update" : "Add"}
              </button>
              {editingCategory && (
                <button
                  onClick={() => {
                    setEditingCategory(null);
                    setCategoryForm({ name: "", slug: "", icon: "", sort_order: 0 });
                  }}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition text-sm"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#1B5E20] border-t-transparent" />
          </div>
        ) : activeTab === "products" ? (
          filteredProducts.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <span className="material-symbols-rounded text-6xl">inventory_2</span>
              <p className="mt-4 text-lg">No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredProducts.map((p) => (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition"
                >
                  <div className="aspect-square bg-gray-100 relative">
                    {p.image ? (
                      <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="material-symbols-rounded text-gray-300 text-5xl">image</span>
                      </div>
                    )}
                    {!p.is_active && (
                      <div className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white text-xs rounded-lg font-medium">
                        Inactive
                      </div>
                    )}
                    {p.discount_price && p.discount_price < p.price && (
                      <div className="absolute top-2 left-2 px-2 py-1 bg-[#1B5E20] text-white text-xs rounded-lg font-medium">
                        Sale
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-gray-800 text-sm leading-tight">{p.name}</h3>
                    </div>
                    <p className="text-xs text-gray-400 mb-2">{getCategoryName(p.category_id)}</p>
                    <div className="flex items-baseline gap-2 mb-3">
                      {p.discount_price && p.discount_price < p.price ? (
                        <>
                          <span className="text-[#1B5E20] font-bold">Rp {Number(p.discount_price).toLocaleString('id-ID')}</span>
                          <span className="text-gray-400 text-xs line-through">Rp {Number(p.price).toLocaleString('id-ID')}</span>
                        </>
                      ) : (
                        <span className="text-[#1B5E20] font-bold">Rp {Number(p.price).toLocaleString('id-ID')}</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <span>{p.brand || "—"}</span>
                      <span className={p.stock > 0 ? "text-[#1B5E20]" : "text-red-500"}>
                        Stock: {p.stock ?? 0}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditProduct(p)}
                        className="flex-1 flex items-center justify-center gap-1 py-2 border border-[#1B5E20] text-[#1B5E20] rounded-xl hover:bg-[#E8F5E9] transition text-xs"
                      >
                        <span className="material-symbols-rounded text-sm">edit</span>
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ type: "product", item: p })}
                        className="flex items-center justify-center px-2 py-2 border border-red-200 text-red-500 rounded-xl hover:bg-red-50 transition"
                      >
                        <span className="material-symbols-rounded text-sm">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : filteredCategories.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <span className="material-symbols-rounded text-6xl">label</span>
            <p className="mt-4 text-lg">No categories found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredCategories.map((cat) => (
              <div
                key={cat.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-4 hover:shadow-md transition"
              >
                <div className="w-12 h-12 rounded-xl bg-[#E8F5E9] flex items-center justify-center flex-shrink-0">
                  {cat.icon ? (
                    <span className="material-symbols-rounded text-[#1B5E20]">{cat.icon}</span>
                  ) : (
                    <span className="material-symbols-rounded text-[#1B5E20]">category</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-800">{cat.name}</h4>
                  <p className="text-xs text-gray-400">{cat.slug}</p>
                </div>
                <span className="text-xs text-gray-400">Order: {cat.sort_order ?? 0}</span>
                <button
                  onClick={() => {
                    setEditingCategory(cat);
                    setCategoryForm({
                      name: cat.name || "",
                      slug: cat.slug || "",
                      icon: cat.icon || "",
                      sort_order: cat.sort_order ?? 0,
                    });
                  }}
                  className="p-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition"
                >
                  <span className="material-symbols-rounded text-lg">edit</span>
                </button>
                <button
                  onClick={() => setDeleteConfirm({ type: "category", item: cat })}
                  className="p-2 border border-red-200 text-red-500 rounded-xl hover:bg-red-50 transition"
                >
                  <span className="material-symbols-rounded text-lg">delete</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">
                {editing ? "Edit Product" : "Add Product"}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <span className="material-symbols-rounded">close</span>
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1B5E20] outline-none"
                  placeholder="Product name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1B5E20] outline-none resize-none"
                  placeholder="Product description..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select
                  value={productForm.category_id}
                  onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1B5E20] outline-none"
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (Rp) *</label>
                  <input
                    type="number"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1B5E20] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount Price (Rp)</label>
                  <input
                    type="number"
                    value={productForm.discount_price}
                    onChange={(e) => setProductForm({ ...productForm, discount_price: e.target.value })}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1B5E20] outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                  <input
                    type="text"
                    value={productForm.brand}
                    onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1B5E20] outline-none"
                    placeholder="Brand name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                  <input
                    type="number"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                    min="0"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1B5E20] outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProductForm({ ...productForm, image: e.target.files[0] })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-[#E8F5E9] file:text-[#1B5E20] file:font-medium file:cursor-pointer"
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setProductForm({ ...productForm, is_active: !productForm.is_active })}
                  className={`relative w-12 h-6 rounded-full transition ${
                    productForm.is_active ? "bg-[#1B5E20]" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      productForm.is_active ? "translate-x-6" : ""
                    }`}
                  />
                </button>
                <span className="text-sm font-medium text-gray-700">
                  {productForm.is_active ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t">
              <button
                onClick={() => setModalOpen(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProduct}
                disabled={!productForm.name || !productForm.price || !productForm.category_id || saving}
                className="flex-1 py-2.5 bg-[#1B5E20] text-white rounded-xl hover:bg-[#2E7D32] transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : editing ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <span className="material-symbols-rounded text-red-500">warning</span>
              </div>
              <div>
                <h3 className="font-bold text-gray-800">
                  Delete {deleteConfirm.type === "product" ? "Product" : "Category"}
                </h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{deleteConfirm.item.name}</strong>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  deleteConfirm.type === "product"
                    ? handleDeleteProduct(deleteConfirm.item.id)
                    : handleDeleteCategory(deleteConfirm.item.id)
                }
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
