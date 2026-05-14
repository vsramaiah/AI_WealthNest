import { Link, Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import AddTransaction from './pages/AddTransaction'
import AssetDetails from './pages/AssetDetails'
import Home from './pages/Home'
import Portfolio from './pages/Portfolio'
import Settings from './pages/Settings'
import TransactionDetails from './pages/TransactionDetails'
import Transactions from './pages/Transactions'
import UpcomingSips from './pages/UpcomingSips'

function NotFound() {
  return (
    <div className="glass-card mx-1 mt-4 flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <p className="eyebrow">Page Not Found</p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-wn-text">This page is not available.</h1>
      <p className="mt-3 max-w-xs text-sm leading-6 text-wn-muted">
        The link may be incorrect or the page may have been moved. Return to the dashboard to continue.
      </p>
      <Link
        to="/home"
        className="primary-button mt-6"
      >
        Go to Home
      </Link>
    </div>
  )
}

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
        <Route path="/upcoming-sips" element={<UpcomingSips />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
