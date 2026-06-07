import { useState } from 'react'
import type { FormEvent } from 'react'

export type RemainingPaymentMethod = 'CARD' | 'BANK_TRANSFER' | 'CASH'

type RemainingPaymentModalProps = {
  amount: number
  error?: string
  hotelName: string
  isPending: boolean
  onClose: () => void
  onSubmit: (paymentMethod: RemainingPaymentMethod) => void
}

function RemainingPaymentModal({
  amount,
  error,
  hotelName,
  isPending,
  onClose,
  onSubmit,
}: RemainingPaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<RemainingPaymentMethod>('CARD')
  const [cardNumber, setCardNumber] = useState('')
  const [expDate, setExpDate] = useState('')
  const [cvv, setCvv] = useState('')
  const [bank, setBank] = useState('')

  const submitPayment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit(paymentMethod)
  }

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-900/50 px-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-6 shadow-2xl shadow-slate-900/20">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-semibold text-slate-900">Pay remaining balance</h3>
            <p className="mt-1 text-sm text-slate-500">{hotelName}</p>
          </div>
          <button aria-label="Close payment form" className="text-xl text-slate-500" onClick={onClose} type="button">
            ×
          </button>
        </div>

        <form className="mt-6 space-y-4" onSubmit={submitPayment}>
          <label className="grid gap-1 text-sm font-medium text-slate-800">
            Payment Method
            <select
              className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-primary"
              onChange={(event) => setPaymentMethod(event.target.value as RemainingPaymentMethod)}
              value={paymentMethod}
            >
              <option value="CARD">Card</option>
              <option value="BANK_TRANSFER">Bank transfer</option>
              <option value="CASH">Cash</option>
            </select>
          </label>

          {paymentMethod === 'CARD' ? (
            <>
              <label className="grid gap-1 text-sm font-medium text-slate-800">
                Card Number
                <input
                  autoComplete="cc-number"
                  className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-primary"
                  inputMode="numeric"
                  minLength={12}
                  onChange={(event) => setCardNumber(event.target.value)}
                  placeholder="0000 0000 0000 0000"
                  required
                  value={cardNumber}
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-1 text-sm font-medium text-slate-800">
                  Exp Date
                  <input
                    autoComplete="cc-exp"
                    className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-primary"
                    onChange={(event) => setExpDate(event.target.value)}
                    placeholder="MM/YY"
                    required
                    value={expDate}
                  />
                </label>
                <label className="grid gap-1 text-sm font-medium text-slate-800">
                  CVV
                  <input
                    autoComplete="cc-csc"
                    className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-primary"
                    inputMode="numeric"
                    maxLength={4}
                    minLength={3}
                    onChange={(event) => setCvv(event.target.value)}
                    placeholder="123"
                    required
                    value={cvv}
                  />
                </label>
              </div>
            </>
          ) : null}

          {paymentMethod === 'BANK_TRANSFER' ? (
            <label className="grid gap-1 text-sm font-medium text-slate-800">
              Bank
              <input
                className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-primary"
                minLength={2}
                onChange={(event) => setBank(event.target.value)}
                placeholder="Bank name"
                required
                value={bank}
              />
            </label>
          ) : null}

          {paymentMethod === 'CASH' ? (
            <p className="rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-600">
              Cash payment will be recorded as paid in the current demo payment system.
            </p>
          ) : null}

          <div className="rounded-lg bg-slate-50 px-4 py-3">
            <p className="text-sm text-slate-500">Amount to pay</p>
            <p className="text-2xl font-semibold text-slate-900">${amount}</p>
          </div>

          {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}

          <div className="flex gap-3">
            <button
              className="h-11 flex-1 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600"
              disabled={isPending}
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className="h-11 flex-1 rounded-lg bg-primary text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isPending}
              type="submit"
            >
              {isPending ? 'Processing...' : `Pay $${amount}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RemainingPaymentModal
