import { mutualFundTransactionSchema } from './mutualFunds'
import {
  otherInvestmentOptions,
  otherInvestmentSchemas,
} from './otherInvestments'

const stockSchema = [
  {
    name: 'broker',
    label: 'Broker',
    type: 'text',
    placeholder: 'Enter broker name',
    required: true,
  },
  {
    name: 'tradeDate',
    label: 'Trade Date',
    type: 'date',
    required: true,
  },
  {
    name: 'exchange',
    label: 'Exchange',
    type: 'select',
    placeholder: 'Choose exchange',
    required: true,
    options: [
      { label: 'NSE', value: 'NSE' },
      { label: 'BSE', value: 'BSE' },
    ],
  },
  {
    name: 'ticker',
    label: 'Ticker',
    type: 'text',
    placeholder: 'Enter stock ticker',
    required: true,
  },
  {
    name: 'stockName',
    label: 'Stock Name',
    type: 'text',
    placeholder: 'Enter company name',
    required: true,
  },
  {
    name: 'orderType',
    label: 'Order Type',
    type: 'select',
    placeholder: 'Choose order type',
    required: true,
    options: [
      { label: 'Delivery', value: 'Delivery' },
      { label: 'Intraday', value: 'Intraday' },
    ],
  },
  {
    name: 'txnType',
    label: 'Transaction Type',
    type: 'select',
    placeholder: 'Choose transaction type',
    required: true,
    options: [
      { label: 'BUY', value: 'BUY' },
      { label: 'SELL', value: 'SELL' },
      { label: 'TRANSFER', value: 'TRANSFER' },
    ],
  },
  {
    name: 'quantity',
    label: 'Quantity',
    type: 'number',
    placeholder: 'Enter quantity',
    required: true,
    min: 0,
    step: '1',
  },
  {
    name: 'pricePerShare',
    label: 'Price Per Share',
    type: 'number',
    placeholder: 'Enter share price',
    required: true,
    min: 0,
    step: '0.01',
  },
  {
    name: 'charges',
    label: 'Charges',
    type: 'number',
    placeholder: 'Enter charges',
    required: true,
    min: 0,
    step: '0.01',
    defaultValue: 0,
  },
  {
    name: 'notes',
    label: 'Notes',
    type: 'text',
    placeholder: 'Optional notes',
    required: false,
  },
]

export const transactionSchemas = {
  stocks: stockSchema,
  mf: mutualFundTransactionSchema,
  ...otherInvestmentSchemas,
}

export const transactionCategoryOptions = [
  { label: 'Stocks', value: 'stocks' },
  { label: 'Mutual Fund', value: 'mf' },
  ...otherInvestmentOptions,
]
