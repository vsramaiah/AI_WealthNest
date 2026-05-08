export const categoryCatalog = [
  {
    id: 'stocks',
    label: 'Stocks',
    group: 'Market',
  },
  {
    id: 'mf',
    label: 'Mutual Funds',
    group: 'Market',
  },
  {
    id: 'crypto',
    label: 'Crypto',
    group: 'Market',
  },
  {
    id: 'goldSilver',
    label: 'Gold / Silver',
    group: 'Real Assets',
  },
  {
    id: 'realEstate',
    label: 'Real Estate',
    group: 'Real Assets',
  },
  {
    id: 'fd',
    label: 'Fixed Deposit',
    group: 'Fixed Income',
  },
  {
    id: 'rd',
    label: 'Recurring Deposit',
    group: 'Fixed Income',
  },
  {
    id: 'ppf',
    label: 'PPF',
    group: 'Fixed Income',
  },
  {
    id: 'epf',
    label: 'EPF',
    group: 'Fixed Income',
  },
  {
    id: 'nps',
    label: 'NPS',
    group: 'Fixed Income',
  },
  {
    id: 'bonds',
    label: 'Bonds',
    group: 'Fixed Income',
  },
  {
    id: 'lic',
    label: 'LIC',
    group: 'Insurance',
  },
]

export function getCategoryMeta(categoryId) {
  return (
    categoryCatalog.find((category) => category.id === categoryId) ?? {
      id: categoryId,
      label: categoryId,
      group: 'Other',
    }
  )
}
