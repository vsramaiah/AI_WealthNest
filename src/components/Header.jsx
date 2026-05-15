import BrandMark from './BrandMark'

export default function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-white/5 bg-wn-bg/88 px-4 pb-4 pt-5 backdrop-blur-xl">
      <div className="rounded-[26px] border border-wn-border bg-white/[0.05] px-3 py-3 shadow-[0_14px_32px_rgba(0,0,0,0.1)]">
        <BrandMark minimal />
      </div>
    </header>
  )
}
