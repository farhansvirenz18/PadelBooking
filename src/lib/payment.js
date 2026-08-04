export function openSnapPopup(snapToken, { onSelect, onSuccess, onError, onClose }) {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.snap) {
      onError?.('Payment system not loaded. Please refresh.')
      resolve({ error: 'snap_not_loaded' })
      return
    }

    window.snap.pay(snapToken, {
      onSelect: (data) => {
        onSelect?.(data)
      },
      onSuccess: (result) => {
        onSuccess?.(result)
        resolve({ success: true, result })
      },
      onPending: (result) => {
        onPending?.(result)
        resolve({ pending: true, result })
      },
      onError: (result) => {
        onError?.(result)
        resolve({ error: result })
      },
      onClose: () => {
        onClose?.()
        resolve({ closed: true })
      },
    })
  })
}

export function isPaymentExpired(createdAt, ttlHours = 24) {
  if (!createdAt) return true
  const created = new Date(createdAt)
  const now = new Date()
  const diffMs = now - created
  const diffHours = diffMs / (1000 * 60 * 60)
  return diffHours > ttlHours
}
