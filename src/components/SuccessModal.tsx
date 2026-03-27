type SuccessModalProps = {
  message: string
  onClose: () => void
}

function SuccessModal({ message, onClose }: SuccessModalProps) {
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-900/50 px-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-7 text-center shadow-2xl shadow-slate-900/20">
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-3xl text-emerald-600">
          ✓
        </div>
        <h3 className="text-2xl font-semibold text-slate-900">Success</h3>
        <p className="mt-3 text-slate-600">{message}</p>
        <button
          className="mt-6 h-11 w-full rounded-xl bg-primary text-sm font-semibold text-white transition hover:bg-blue-700"
          onClick={onClose}
          type="button"
        >
          Continue
        </button>
      </div>
    </div>
  )
}

export default SuccessModal
