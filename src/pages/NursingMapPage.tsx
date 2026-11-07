/**
 * แผนที่ห้องให้นมและมุมเปลี่ยนผ้าอ้อม — Leaflet + OpenStreetMap (ไม่ต้องใช้ API key)
 * ตรรกะและที่เก็บข้อมูลอยู่ใน src/lib/places.ts (สลับไป Firestore ได้ที่ไฟล์นั้นไฟล์เดียว)
 */
import 'leaflet/dist/leaflet.css'
import { CheckCircleIcon, CrosshairIcon, MapPinPlusIcon, NavigationArrowIcon, ProhibitIcon, XIcon } from '../components/icons'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { th } from 'date-fns/locale'
import L from 'leaflet'
import { useEffect, useId, useState, type FormEvent, type ReactNode } from 'react'
import { CircleMarker, MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { BackToTools } from '../components/ToolSafety'
import { useToday } from '../lib/useToday'
import { Badge, Button, Card, Field, PageHeader, inputClass } from '../components/ui'
import {
  AMENITIES,
  BANGKOK_CENTER,
  STALE_AFTER_DAYS,
  amenityLabel,
  formatDistance,
  getPlaceStatus,
  googleMapsDirectionsUrl,
  placeRepository,
  sortByDistance,
  validatePlace,
  type Amenity,
  type LatLng,
  type Place,
  type PlaceStatus,
  type Vote,
} from '../lib/places'

const STATUS_META: Record<PlaceStatus, { label: string; color: string; tone: 'success' | 'neutral' | 'danger' }> = {
  fresh: { label: `ยืนยันแล้วใน ${STALE_AFTER_DAYS} วัน`, color: 'var(--color-success)', tone: 'success' },
  stale: { label: `ไม่มีคนยืนยันเกิน ${STALE_AFTER_DAYS} วัน`, color: '#8f978f', tone: 'neutral' },
  closed: { label: 'มีรายงานว่าปิดแล้ว', color: 'var(--color-danger)', tone: 'danger' },
}

/** หมุดแบบ SVG (ไม่ใช้ไฟล์รูปของ Leaflet ที่มักหายตอน bundle) — มีขอบขาวให้เห็นชัดบนแผนที่ */
function pinIcon(color: string, closed = false) {
  const mark = closed
    ? '<path d="M9 9l6 6M15 9l-6 6" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>'
    : '<circle cx="12" cy="12" r="3.6" fill="#fff"/>'
  return L.divIcon({
    className: '',
    iconSize: [32, 40],
    iconAnchor: [16, 38],
    popupAnchor: [0, -34],
    html: `<svg width="32" height="40" viewBox="0 0 24 30" aria-hidden="true"><path d="M12 29s9-9.2 9-16.2A9 9 0 0 0 3 12.8C3 19.8 12 29 12 29z" fill="${color}" stroke="#fff" stroke-width="1.6"/>${mark}</svg>`,
  })
}

const draftIcon = pinIcon('var(--color-accent-strong)')

/** เลื่อนแผนที่ไปยังจุดที่ต้องการ */
function FlyTo({ target }: { target: (LatLng & { zoom: number }) | null }) {
  const map = useMap()
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], target.zoom, { duration: 0.6 })
  }, [map, target])
  return null
}

/** รับการแตะบนแผนที่ระหว่างโหมดเพิ่มจุด */
function ClickToPlace({ enabled, onPick }: { enabled: boolean; onPick: (p: LatLng) => void }) {
  useMapEvents({
    click(e) {
      if (enabled) onPick({ lat: e.latlng.lat, lng: e.latlng.lng })
    },
  })
  return null
}

function geolocationErrorText(err: GeolocationPositionError | null): string {
  if (!window.isSecureContext) return 'เบราว์เซอร์อนุญาตให้ใช้ตำแหน่งเฉพาะเว็บที่เปิดผ่าน https หรือ localhost'
  if (!err) return 'อุปกรณ์นี้ไม่รองรับการหาตำแหน่ง'
  if (err.code === err.PERMISSION_DENIED) return 'ไม่ได้รับอนุญาตให้ใช้ตำแหน่ง — เปิดสิทธิ์ตำแหน่งให้เว็บนี้ในการตั้งค่าเบราว์เซอร์'
  if (err.code === err.TIMEOUT) return 'หาตำแหน่งนานเกินไป ลองใหม่อีกครั้งในที่โล่ง'
  return 'หาตำแหน่งไม่ได้ ลองใหม่อีกครั้ง'
}

export default function NursingMapPage() {
  const [places, setPlaces] = useState<Place[] | null>(null)
  const [votes, setVotes] = useState<Record<string, Vote>>({})
  const [userPos, setUserPos] = useState<LatLng | null>(null)
  const [flyTarget, setFlyTarget] = useState<(LatLng & { zoom: number }) | null>(null)
  const [locating, setLocating] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState<LatLng | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const now = useToday()

  async function refresh() {
    const [list, mine] = await Promise.all([placeRepository.list(), placeRepository.myVotes()])
    setPlaces(list)
    setVotes(mine)
  }

  useEffect(() => {
    let cancelled = false
    Promise.all([placeRepository.list(), placeRepository.myVotes()]).then(([list, mine]) => {
      if (cancelled) return
      setPlaces(list)
      setVotes(mine)
    })
    return () => {
      cancelled = true
    }
  }, [])

  /** ขอตำแหน่งผู้ใช้ — onFound ใช้ต่อ เช่น ปักหมุดจุดใหม่ที่ตำแหน่งนี้ */
  function locate(onFound?: (p: LatLng) => void) {
    setGeoError(null)
    if (!('geolocation' in navigator) || !window.isSecureContext) {
      setGeoError(geolocationErrorText(null))
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setUserPos(p)
        setFlyTarget({ ...p, zoom: 15 })
        setLocating(false)
        onFound?.(p)
      },
      (err) => {
        setGeoError(geolocationErrorText(err))
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    )
  }

  async function onVote(id: string, vote: Vote) {
    const undoing = votes[id] === vote
    await placeRepository.vote(id, vote)
    await refresh()
    setNotice(undoing ? 'ยกเลิกแล้ว' : vote === 'open' ? 'ขอบคุณที่ยืนยัน — กดอีกครั้งถ้ากดผิด' : 'บันทึกว่าปิดแล้ว — กดอีกครั้งถ้ากดผิด')
  }

  const sorted = sortByDistance(places ?? [], userPos)

  return (
    <>
      <BackToTools />
      <PageHeader title="แผนที่ห้องให้นม" subtitle="ห้องให้นมและมุมเปลี่ยนผ้าอ้อม — ช่วยกันเพิ่มและยืนยันข้อมูล" />

      <div className="mb-3 grid grid-cols-2 gap-2">
        <Button onClick={() => locate()} disabled={locating}>
          <CrosshairIcon size={20} aria-hidden="true" />
          {locating ? 'กำลังหา…' : 'หาใกล้ฉัน'}
        </Button>
        <Button
          variant="secondary"
          aria-pressed={adding}
          onClick={() => {
            setAdding((a) => !a)
            setDraft(null)
            setNotice(null)
          }}
        >
          <MapPinPlusIcon size={20} aria-hidden="true" />
          {adding ? 'ยกเลิกเพิ่มจุด' : 'เพิ่มจุดใหม่'}
        </Button>
      </div>
      <div aria-live="polite" className="min-h-5 text-sm">
        {geoError && <p className="mb-2 rounded-xl bg-warning-soft px-3 py-2 text-ink">{geoError}</p>}
        {notice && <p className="mb-2 text-primary-strong">{notice}</p>}
      </div>

      {/* isolate: กัน z-index ของ Leaflet ไม่ให้ทับแถบหัวและเมนูล่าง */}
      <div className="isolate overflow-hidden rounded-[var(--radius-card)] border border-line shadow-[var(--shadow-card)]">
        {adding && (
          <p className="bg-accent-soft px-4 py-2 text-sm font-medium text-ink">แตะบนแผนที่เพื่อปักหมุดตำแหน่งห้องให้นม</p>
        )}
        <MapContainer
          center={[BANGKOK_CENTER.lat, BANGKOK_CENTER.lng]}
          zoom={12}
          scrollWheelZoom={false}
          className={`h-80 w-full ${adding ? 'cursor-crosshair' : ''}`}
          aria-label="แผนที่ห้องให้นม"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FlyTo target={flyTarget} />
          <ClickToPlace enabled={adding} onPick={setDraft} />
          {sorted.map((p) => {
            const status = getPlaceStatus(p, now)
            return (
              <Marker key={p.id} position={[p.lat, p.lng]} icon={pinIcon(STATUS_META[status].color, status === 'closed')} title={p.name}>
                <Popup>
                  <strong>{p.name}</strong>
                  {p.floor && <div>{p.floor}</div>}
                  <div>
                    {formatDistance(p.distanceKm)} · {STATUS_META[status].label}
                  </div>
                  <a href={googleMapsDirectionsUrl(p)} target="_blank" rel="noopener noreferrer">
                    นำทางด้วย Google Maps
                  </a>
                </Popup>
              </Marker>
            )
          })}
          {userPos && (
            <CircleMarker center={[userPos.lat, userPos.lng]} radius={8} pathOptions={{ color: '#fff', weight: 3, fillColor: '#2b84b8', fillOpacity: 1 }} />
          )}
          {draft && <Marker position={[draft.lat, draft.lng]} icon={draftIcon} title="ตำแหน่งที่จะเพิ่ม" />}
        </MapContainer>
      </div>
      <Legend />

      {adding && (
        <AddPlaceForm
          draft={draft}
          locating={locating}
          onUseMyLocation={() => locate((p) => setDraft(p))}
          onCancel={() => {
            setAdding(false)
            setDraft(null)
          }}
          onSaved={async (name) => {
            setAdding(false)
            setDraft(null)
            setNotice(`เพิ่ม “${name}” แล้ว ขอบคุณที่ช่วยแชร์`)
            await refresh()
          }}
        />
      )}

      <section aria-labelledby="place-list" className="mt-6">
        <h2 id="place-list" className="text-lg font-semibold">
          {userPos ? 'ใกล้คุณที่สุด' : 'รายการทั้งหมด (เรียงจากใจกลางกรุงเทพฯ)'}
        </h2>
        {!userPos && <p className="text-sm text-ink-muted">กด “หาใกล้ฉัน” เพื่อเรียงตามระยะทางจากตำแหน่งของคุณ</p>}
        {places === null ? (
          <p className="mt-3 text-ink-muted">กำลังโหลด…</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {sorted.map((p) => (
              <PlaceItem
                key={p.id}
                place={p}
                status={getPlaceStatus(p, now)}
                myVote={votes[p.id]}
                fromUser={!!userPos}
                onShow={() => {
                  setFlyTarget({ lat: p.lat, lng: p.lng, zoom: 16 })
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                onVote={(v) => onVote(p.id, v)}
              />
            ))}
          </ul>
        )}
      </section>

      <p className="mt-6 text-xs text-ink-muted">
        แผนที่ © ผู้ร่วมพัฒนา OpenStreetMap · จุดตั้งต้นเป็นห้างและโรงพยาบาลใหญ่ที่มีห้องให้นม พิกัดระดับอาคาร (อาจคลาดเคลื่อน 100–200 ม.) ·
        จุดที่เพิ่มและการยืนยันตอนนี้เก็บในเครื่องนี้เท่านั้น — ควรโทรถามสถานที่ก่อนเดินทาง
      </p>
    </>
  )
}

function Legend() {
  const items: { color: string; label: string; closed?: boolean }[] = [
    { color: STATUS_META.fresh.color, label: 'ยืนยันแล้ว' },
    { color: STATUS_META.stale.color, label: `ไม่ยืนยันเกิน ${STALE_AFTER_DAYS} วัน` },
    { color: STATUS_META.closed.color, label: 'รายงานว่าปิด', closed: true },
    { color: '#2b84b8', label: 'คุณอยู่ที่นี่' },
  ]
  return (
    <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-1.5">
          <span className="grid size-3 place-items-center rounded-full text-[8px] leading-none text-white" style={{ background: i.color }} aria-hidden="true">
            {i.closed ? '×' : ''}
          </span>
          {i.label}
        </span>
      ))}
    </p>
  )
}

function PlaceItem({
  place,
  status,
  myVote,
  fromUser,
  onShow,
  onVote,
}: {
  place: Place & { distanceKm: number }
  status: PlaceStatus
  myVote?: Vote
  fromUser: boolean
  onShow: () => void
  onVote: (v: Vote) => void
}) {
  const meta = STATUS_META[status]
  const confirmedText =
    place.source === 'seed' && place.confirmCount === 0
      ? 'ข้อมูลตั้งต้นจากแอป ยังไม่มีผู้ใช้ยืนยัน'
      : place.lastConfirmed
        ? `ยืนยันล่าสุด ${formatDistanceToNow(parseISO(place.lastConfirmed), { addSuffix: true, locale: th })}`
        : 'ยังไม่มีผู้ใช้ยืนยัน'
  return (
    <li className={`rounded-[var(--radius-card)] border bg-surface p-4 shadow-[var(--shadow-card)] ${status === 'fresh' ? 'border-line' : 'border-line opacity-90'}`}>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <button type="button" onClick={onShow} className="min-h-11 cursor-pointer text-left font-semibold leading-snug text-ink hover:underline">
            {place.name}
          </button>
          <p className="text-sm text-ink-muted">{place.floor || 'ยังไม่ระบุชั้น — สอบถามประชาสัมพันธ์'}</p>
        </div>
        <p className="shrink-0 text-right text-sm font-semibold tabular-nums">
          {formatDistance(place.distanceKm)}
          <span className="block text-xs font-normal text-ink-muted">{fromUser ? 'จากคุณ' : 'จากใจกลางเมือง'}</span>
        </p>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Badge tone={meta.tone}>{meta.label}</Badge>
        <span className="text-xs text-ink-muted">{confirmedText}</span>
      </div>
      {place.amenities.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="สิ่งอำนวยความสะดวก">
          {place.amenities.map((a) => (
            <li key={a} className="rounded-md bg-surface-muted px-2 py-0.5 text-xs text-ink">
              {amenityLabel(a)}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 grid grid-cols-2 gap-2">
        <a
          href={googleMapsDirectionsUrl(place)}
          target="_blank"
          rel="noopener noreferrer"
          className="col-span-2 flex min-h-11 items-center justify-center gap-1.5 rounded-full bg-primary px-3 text-sm font-semibold text-on-primary hover:bg-primary-hover"
        >
          <NavigationArrowIcon size={18} aria-hidden="true" />
          นำทาง
        </a>
        <VoteButton active={myVote === 'open'} onClick={() => onVote('open')} icon={<CheckCircleIcon size={18} aria-hidden="true" />}>
          ยังมีอยู่ <span className="tabular-nums text-ink-muted">{place.confirmCount}</span>
        </VoteButton>
        <VoteButton active={myVote === 'closed'} danger onClick={() => onVote('closed')} icon={<ProhibitIcon size={18} aria-hidden="true" />}>
          ปิดแล้ว <span className="tabular-nums text-ink-muted">{place.closedCount}</span>
        </VoteButton>
      </div>
    </li>
  )
}

function VoteButton({
  active,
  danger,
  onClick,
  icon,
  children,
}: {
  active: boolean
  danger?: boolean
  onClick: () => void
  icon: ReactNode
  children: ReactNode
}) {
  const activeCls = danger ? 'border-danger bg-danger-soft text-danger' : 'border-success bg-success-soft text-success'
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={active ? 'กดอีกครั้งเพื่อยกเลิก' : undefined}
      className={`flex min-h-11 cursor-pointer items-center justify-center gap-1.5 rounded-full border px-3 text-sm font-semibold transition-colors duration-150 ${
        active ? activeCls : 'border-line bg-surface text-ink hover:bg-surface-muted'
      }`}
    >
      {icon}
      {children}
    </button>
  )
}

function AddPlaceForm({
  draft,
  locating,
  onUseMyLocation,
  onCancel,
  onSaved,
}: {
  draft: LatLng | null
  locating: boolean
  onUseMyLocation: () => void
  onCancel: () => void
  onSaved: (name: string) => void
}) {
  const uid = useId()
  const [name, setName] = useState('')
  const [floor, setFloor] = useState('')
  const [amenities, setAmenities] = useState<Amenity[]>([])
  const [errors, setErrors] = useState<ReturnType<typeof validatePlace>>({})
  const [formError, setFormError] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    const input = { name, floor, amenities, lat: draft?.lat ?? NaN, lng: draft?.lng ?? NaN }
    const found = validatePlace(input)
    setErrors(found)
    if (Object.keys(found).length > 0) {
      if (found.name) document.getElementById(`${uid}-name`)?.focus()
      return
    }
    try {
      await placeRepository.add(input)
      onSaved(name.trim())
    } catch (err) {
      setFormError((err as Error).message)
    }
  }

  const toggle = (a: Amenity) => setAmenities((list) => (list.includes(a) ? list.filter((x) => x !== a) : [...list, a]))

  return (
    <Card className="mt-4">
      <form onSubmit={submit} noValidate className="space-y-4">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-lg font-semibold">เพิ่มห้องให้นม / มุมเปลี่ยนผ้าอ้อม</h2>
          <button type="button" onClick={onCancel} aria-label="ปิดฟอร์ม" className="grid size-11 cursor-pointer place-items-center rounded-full text-ink-muted hover:bg-surface-muted">
            <XIcon size={20} aria-hidden="true" />
          </button>
        </div>

        <div>
          <p className="font-medium">ตำแหน่ง</p>
          <p className={`mt-1 text-sm ${draft ? 'text-ink' : 'text-ink-muted'}`}>
            {draft ? `ปักหมุดแล้วที่ ${draft.lat.toFixed(5)}, ${draft.lng.toFixed(5)}` : 'แตะบนแผนที่ด้านบน หรือใช้ตำแหน่งปัจจุบัน'}
          </p>
          {errors.position && (
            <p role="alert" className="mt-1 text-sm text-danger">
              {errors.position}
            </p>
          )}
          <Button variant="secondary" className="mt-2 w-full" onClick={onUseMyLocation} disabled={locating}>
            <CrosshairIcon size={18} aria-hidden="true" />
            {locating ? 'กำลังหาตำแหน่ง…' : 'ใช้ตำแหน่งปัจจุบัน'}
          </Button>
        </div>

        <Field id={`${uid}-name`} label="ชื่อสถานที่" required error={errors.name}>
          <input
            id={`${uid}-name`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            placeholder="เช่น ห้างใกล้บ้าน ห้องให้นมข้างห้องน้ำหญิง"
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? `${uid}-name-error` : undefined}
            className={inputClass}
          />
        </Field>
        <Field id={`${uid}-floor`} label="ชั้น / จุดสังเกต">
          <input id={`${uid}-floor`} value={floor} onChange={(e) => setFloor(e.target.value)} maxLength={60} placeholder="เช่น ชั้น 3 โซนเด็ก" className={inputClass} />
        </Field>

        <fieldset>
          <legend className="mb-2 font-medium">สิ่งอำนวยความสะดวก</legend>
          <div className="grid grid-cols-2 gap-2">
            {AMENITIES.map((a) => (
              <label
                key={a.id}
                className={`flex min-h-12 cursor-pointer items-center gap-2 rounded-2xl border-2 px-3 text-sm font-medium has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary-strong ${
                  amenities.includes(a.id) ? 'border-primary-strong bg-primary-soft' : 'border-line bg-surface'
                }`}
              >
                <input type="checkbox" checked={amenities.includes(a.id)} onChange={() => toggle(a.id)} className="size-5 accent-[var(--color-primary-strong)]" />
                {a.label}
              </label>
            ))}
          </div>
        </fieldset>

        {formError && (
          <p role="alert" className="text-sm text-danger">
            {formError}
          </p>
        )}
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={onCancel}>
            ยกเลิก
          </Button>
          <Button type="submit">บันทึกจุดนี้</Button>
        </div>
      </form>
    </Card>
  )
}
