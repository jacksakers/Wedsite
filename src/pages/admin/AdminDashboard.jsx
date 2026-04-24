import { useState } from 'react'
import { signOut } from 'firebase/auth'
import { useNavigate } from 'react-router-dom'
import { auth } from '../../firebase'
import OverviewTab from './tabs/OverviewTab'
import RSVPsTab from './tabs/RSVPsTab'
import GuestListTab from './tabs/GuestListTab'
import PhotosTab from './tabs/PhotosTab'
import AdminsTab from './tabs/AdminsTab'
import VendorsTab from './tabs/VendorsTab'
import InfoContentTab from './tabs/InfoContentTab'
import OurStoryTab from './tabs/OurStoryTab'

const TABS = [
  { id: 'overview',  label: 'Overview' },
  { id: 'rsvps',     label: 'RSVPs' },
  { id: 'guests',    label: 'Guest List' },
  { id: 'photos',    label: 'Photos' },
  { id: 'vendors',   label: 'Vendors' },
  { id: 'admins',    label: 'Admins' },
  { id: 'details',   label: 'Details Page' },
  { id: 'ourstory',  label: 'Our Story' },
]

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut(auth)
    navigate('/')
  }

  return (
    <main className="bg-paper min-h-svh">
      {/* Header */}
      <div className="bg-palmetto py-8 px-6 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="font-serif text-paper text-2xl">Admin Dashboard</h1>
          <div className="flex items-center gap-3">
            <a
              href="/slideshow"
              target="_blank"
              rel="noopener noreferrer"
              className="font-sans text-xs tracking-widest uppercase text-paper/70 border border-paper/30 rounded px-4 py-2 hover:text-paper hover:border-paper transition-colors"
            >
              Slideshow ↗
            </a>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-sans text-xs tracking-widest uppercase text-paper/70 border border-paper/30 rounded px-4 py-2 hover:text-paper hover:border-paper transition-colors"
            >
              Preview Site ↗
            </a>
            <button
              onClick={handleSignOut}
              className="font-sans text-xs tracking-widest uppercase text-paper/70 border border-paper/30 rounded px-4 py-2 hover:text-paper hover:border-paper transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Tab nav */}
        <div className="max-w-6xl mx-auto mt-4 flex gap-1 overflow-x-auto pb-0.5">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`font-sans text-xs tracking-[0.15em] uppercase px-4 py-2 rounded transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-paper/20 text-paper'
                  : 'text-paper/50 hover:text-paper/80'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-6xl mx-auto py-10 px-6">
        {activeTab === 'overview'  && <OverviewTab />}
        {activeTab === 'rsvps'     && <RSVPsTab />}
        {activeTab === 'guests'    && <GuestListTab />}
        {activeTab === 'photos'    && <PhotosTab />}
        {activeTab === 'vendors'   && <VendorsTab />}
        {activeTab === 'admins'    && <AdminsTab />}
        {activeTab === 'details'   && <InfoContentTab />}
        {activeTab === 'ourstory'  && <OurStoryTab />}
      </div>
    </main>
  )
}

