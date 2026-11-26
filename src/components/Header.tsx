import { AppTab } from '../types/vocab';

interface HeaderProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  dueCount: number;
  onStartQuickReview: () => void;
}

const NAV_ITEMS: { id: AppTab; label: string }[] = [
  { id: 'overview', label: 'Bài học' },
  { id: 'memorize', label: 'Ghi nhớ' },
  { id: 'write', label: 'Luyện viết' },
  { id: 'notebook', label: 'Sổ tay' },
];

export function Header({
  activeTab,
  onSelectTab,
  dueCount,
  onStartQuickReview,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-[#E4E4E7] bg-[#FFFFFF]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:gap-8 sm:px-6">
        <button
          type="button"
          onClick={() => onSelectTab('overview')}
          className="text-left text-lg font-bold tracking-tight text-[#18181B] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C8322B]"
        >
          Phồn Thể Studio
        </button>

        <nav
          aria-label="Điều hướng chính"
          className="hidden md:flex items-center gap-6"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative py-1.5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C8322B] ${
                  isActive
                    ? 'text-[#C8322B]'
                    : 'text-[#52525B] hover:text-[#18181B]'
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-[13px] h-0.5 bg-[#C8322B]"
                  />
                )}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onStartQuickReview}
            className="rounded-lg bg-[#C8322B] px-4 py-2 text-xs sm:text-sm font-semibold text-white transition-colors hover:bg-[#A82620] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C8322B] tabular-nums"
          >
            {dueCount > 0 ? `Ôn tập ngay (${dueCount})` : 'Ôn tập ngay'}
          </button>
        </div>
      </div>

      {/* Mobile secondary single-row nav */}
      <nav
        aria-label="Điều hướng di động"
        className="flex md:hidden items-center justify-around border-t border-[#E4E4E7] bg-[#FFFFFF] px-2"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`relative py-2.5 px-2 text-xs font-medium whitespace-nowrap shrink-0 ${
                isActive ? 'text-[#C8322B]' : 'text-[#52525B]'
              }`}
            >
              {item.label}
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-1 bottom-0 h-0.5 bg-[#C8322B]"
                />
              )}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
