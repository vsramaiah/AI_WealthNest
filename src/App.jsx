import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import AddTransaction from './pages/AddTransaction'
import AssetDetails from './pages/AssetDetails'
import Home from './pages/Home'
import Portfolio from './pages/Portfolio'
import Settings from './pages/Settings'
import TransactionDetails from './pages/TransactionDetails'
import Transactions from './pages/Transactions'

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<Home />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/portfolio/:categoryId" element={<AssetDetails />} />
        <Route path="/add" element={<AddTransaction />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/transactions/:transactionId" element={<TransactionDetails />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}
