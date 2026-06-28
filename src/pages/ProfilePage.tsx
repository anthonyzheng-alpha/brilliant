import { Link } from 'react-router-dom'
import { PageShell } from '../components/layout/PageShell'
import { Monster } from '../components/profile/Monster'
import { useGamificationStore } from '../stores/gamificationStore'
import { useAuthStore } from '../stores/authStore'
import { saveUserGamification } from '../lib/syncProgress'
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  SHOP_ITEMS,
  type ItemCategory,
  type ShopItem,
} from '../lib/shop'
import '../components/profile/Profile.css'

export function ProfilePage() {
  const coins = useGamificationStore((s) => s.gamification.coins)
  const profile = useGamificationStore((s) => s.gamification.profile)
  const buyItem = useGamificationStore((s) => s.buyItem)
  const equipItem = useGamificationStore((s) => s.equipItem)
  const unequip = useGamificationStore((s) => s.unequip)
  const user = useAuthStore((s) => s.user)

  const persist = () => {
    if (user) {
      void saveUserGamification(user.uid, useGamificationStore.getState().gamification)
    }
  }

  const isOwned = (item: ShopItem) => profile.ownedItems.includes(item.id)

  const isEquipped = (item: ShopItem) => {
    if (item.category === 'color') return profile.bodyColor === item.id
    return profile.equipped[item.category] === item.id
  }

  const handleBuy = (item: ShopItem) => {
    if (buyItem(item.id)) {
      equipItem(item.id)
      persist()
    }
  }

  const handleEquip = (item: ShopItem) => {
    if (isEquipped(item) && item.category !== 'color') {
      unequip(item.category)
    } else {
      equipItem(item.id)
    }
    persist()
  }

  return (
    <PageShell>
      <Link to="/" className="back-link">
        ← Home
      </Link>
      <h1 className="lesson-page__title">Your Monster</h1>

      <div className="profile">
        <aside className="profile__preview">
          <div className="profile__monster">
            <Monster bodyColor={profile.bodyColor} equipped={profile.equipped} size={220} />
          </div>
          <div className="profile__coins">
            <span className="profile__coins-icon" aria-hidden>
              🪙
            </span>
            <span className="profile__coins-count">{coins}</span>
            <span className="profile__coins-label">coins</span>
          </div>
          <p className="profile__hint">
            Earn more coins by answering correctly in the infinite practice feature.
          </p>
        </aside>

        <section className="profile__shop">
          {CATEGORY_ORDER.map((category) => {
            const items = SHOP_ITEMS.filter((i) => i.category === category)
            if (items.length === 0) return null
            return (
              <div key={category} className="shop-section">
                <h2 className="shop-section__title">{CATEGORY_LABELS[category as ItemCategory]}</h2>
                <div className="shop-grid">
                  {items.map((item) => (
                    <ShopCard
                      key={item.id}
                      item={item}
                      owned={isOwned(item)}
                      equipped={isEquipped(item)}
                      canAfford={coins >= item.price}
                      onBuy={() => handleBuy(item)}
                      onEquip={() => handleEquip(item)}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </section>
      </div>
    </PageShell>
  )
}

type ShopCardProps = {
  item: ShopItem
  owned: boolean
  equipped: boolean
  canAfford: boolean
  onBuy: () => void
  onEquip: () => void
}

function ShopCard({ item, owned, equipped, canAfford, onBuy, onEquip }: ShopCardProps) {
  return (
    <div className={`shop-card${equipped ? ' shop-card--equipped' : ''}`}>
      <div className="shop-card__preview">
        {item.category === 'color' ? (
          <Monster bodyColor={item.id} equipped={{}} size={72} />
        ) : (
          <Monster bodyColor="color-green" equipped={{ [item.category]: item.id }} size={72} />
        )}
      </div>
      <p className="shop-card__name">{item.name}</p>
      {owned ? (
        <button
          type="button"
          className={`btn btn--sm ${equipped ? 'btn--ghost' : 'btn--primary'}`}
          onClick={onEquip}
        >
          {equipped ? (item.category === 'color' ? 'Equipped' : 'Unequip') : 'Equip'}
        </button>
      ) : (
        <button
          type="button"
          className="btn btn--sm btn--primary"
          disabled={!canAfford}
          onClick={onBuy}
          title={canAfford ? undefined : 'Not enough coins'}
        >
          🪙 {item.price}
        </button>
      )}
    </div>
  )
}
