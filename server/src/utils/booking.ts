export const calculateBookingTotals = (pricePerUnit: number, nights: number) => {
  const totalPrice = Number((pricePerUnit * nights).toFixed(2))
  const serviceFee = Number((totalPrice * 0.1).toFixed(2))
  const ownerIncome = Number((totalPrice - serviceFee).toFixed(2))

  return {
    totalPrice,
    serviceFee,
    ownerIncome,
  }
}
