/**
 * ตั้งชื่อลูกตามทักษา — หาวันเกิดทางโหราศาสตร์ → อักษรกาลกิณี → กรองชื่อ / ตรวจชื่อที่คิดเอง
 * ตรรกะอยู่ใน src/lib/taksa.ts และฐานข้อมูลชื่ออยู่ใน src/data/names.ts
 */
import { CheckCircleIcon, HeartIcon, MagnifyingGlassIcon, WarningCircleIcon } from '../components/icons'
import { useId, useState } from 'react'
import { BackToTools } from '../components/ToolSafety'
import { Badge, Card, Field, PageHeader, Segmented, inputClass } from '../components/ui'
import { NAMES, type NameGender } from '../data/names'
import { formatThaiDate } from '../lib/format'
import {
  DAY_LABELS,
  DAY_ORDER,
  PLANET_LABELS,
  ROLE_MEANINGS,
  analyzeName,
  filterNames,
  getKalakiniLetters,
  getTaksaDay,
  getTaksaTable,
  needsBirthTime,
  type Role,
  type TaksaDay,
} from '../lib/taksa'
import { useAppStore } from '../store/useAppStore'
import type { Child } from '../types'

/** สระ/วรรณยุกต์ที่ต้องเกาะพยัญชนะ (ถ้าแสดงเดี่ยว ๆ จะซ้อนกัน) — ใส่วงกลมประ ◌ เป็นตัวรองรับ */
const COMBINING = /[\u0E31\u0E33-\u0E3A\u0E47-\u0E4E]/
const spaced = (letters: string) => [...letters].map((c) => (COMBINING.test(c) ? `\u25CC${c}` : c)).join(' ')

const ROLE_STYLE: Partial<Record<Role, string>> = {
  กาลกิณี: 'bg-danger-soft text-danger',
  เดช: 'bg-success-soft text-success',
  ศรี: 'bg-success-soft text-success',
}

export default function NamePage() {
  const { activeChild } = useAppStore()
  if (!activeChild) return null
  return <NameTool key={activeChild.id} child={activeChild} />
}

function NameTool({ child }: { child: Child }) {
  const { updateChild, toggleFavoriteName } = useAppStore()
  const uid = useId()
  const baseDate = child.mode === 'born' ? child.birthDate : child.dueDate
  const [override, setOverride] = useState<TaksaDay | ''>('')
  const [gender, setGender] = useState<NameGender>(child.sex ?? 'girl')
  const [query, setQuery] = useState('')
  const [check, setCheck] = useState('')

  const computedDay = baseDate ? getTaksaDay(baseDate, child.birthTime) : null
  const day: TaksaDay | null = override || computedDay
  const askTime = !!baseDate && child.mode === 'born' && needsBirthTime(baseDate)

  return (
    <>
      <BackToTools />
      <PageHeader title="ตั้งชื่อลูกตามวันเกิด" subtitle="หาอักษรกาลกิณีตามวันเกิด แล้วเลือกชื่อที่ไม่มีอักษรนั้น" />

      <Card>
        <h2 className="font-semibold">วันเกิดของ{child.name}</h2>
        {baseDate ? (
          <p className="mt-1 text-sm text-ink-muted">
            {child.mode === 'born' ? 'วันเกิด' : 'วันกำหนดคลอด (ประมาณ — วันจริงอาจต่างไป)'} {formatThaiDate(baseDate)}
          </p>
        ) : (
          <p className="mt-1 text-sm text-ink-muted">ยังไม่มีวันเกิดในแอป — เลือกวันเองด้านล่าง</p>
        )}

        {child.mode === 'born' && (
          <div className="mt-3">
            <Field
              id={`${uid}-time`}
              label="เวลาเกิด (ไม่บังคับ)"
              hint={
                askTime
                  ? 'สำคัญสำหรับลูกที่เกิดวันพุธหรือพฤหัส: พุธ 18:00 ขึ้นไป และพฤหัสก่อน 06:00 นับเป็นพุธกลางคืน (ราหู)'
                  : 'ทางโหราศาสตร์ วันใหม่เริ่มตอน 06:00 เกิดก่อน 06:00 นับเป็นวันก่อนหน้า'
              }
            >
              <input
                id={`${uid}-time`}
                type="time"
                value={child.birthTime ?? ''}
                onChange={(e) => updateChild(child.id, { birthTime: e.target.value || undefined })}
                aria-describedby={`${uid}-time-hint`}
                className={`${inputClass} ${askTime && !child.birthTime ? 'border-accent' : ''}`}
              />
            </Field>
          </div>
        )}

        <div className="mt-3">
          <Field id={`${uid}-day`} label="วันเกิดที่ใช้คำนวณ">
            <select
              id={`${uid}-day`}
              value={override}
              onChange={(e) => setOverride(e.target.value as TaksaDay | '')}
              className={`${inputClass} cursor-pointer`}
            >
              {computedDay && <option value="">คำนวณจากวันที่ด้านบน ({DAY_LABELS[computedDay]})</option>}
              {!computedDay && <option value="">— เลือกวัน —</option>}
              {DAY_ORDER.map((d) => (
                <option key={d} value={d}>
                  {DAY_LABELS[d]}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {day && (
          <div className="mt-4 rounded-2xl bg-surface-muted p-4" aria-live="polite">
            <p className="text-sm text-ink-muted">เกิด{DAY_LABELS[day]}</p>
            <p className="mt-1 font-semibold">อักษรกาลกิณี (ไม่ควรมีในชื่อ)</p>
            <p className="mt-1 text-2xl font-bold tracking-wider text-danger">
              {day === 'mon' ? 'สระทุกตัว' : spaced(getKalakiniLetters(day))}
            </p>
            {day === 'mon' && (
              <>
                <p className="mt-1 text-base leading-loose tracking-wide text-ink-muted [overflow-wrap:anywhere]">{spaced(getKalakiniLetters(day))}</p>
                <p className="text-sm text-ink-muted">ชื่อต้องไม่มีรูปสระเลย เช่น ธนพร</p>
              </>
            )}
          </div>
        )}
      </Card>

      {day && (
        <>
          <TaksaTable day={day} />
          <CheckName day={day} value={check} onChange={setCheck} />
          <Favorites child={child} day={day} onToggle={(n) => toggleFavoriteName(child.id, n)} />
          <NameList
            day={day}
            gender={gender}
            setGender={setGender}
            query={query}
            setQuery={setQuery}
            favorites={child.favoriteNames}
            onToggle={(n) => toggleFavoriteName(child.id, n)}
          />
        </>
      )}

      <p className="mt-6 text-xs text-ink-muted">
        ทักษาเป็นความเชื่อตามตำราโหราศาสตร์ไทย ไม่ใช่หลักวิทยาศาสตร์ ใช้ประกอบการตัดสินใจร่วมกับความหมายและเสียงของชื่อ ·
        ความหมายของชื่อเป็นแบบสรุปจากรากศัพท์ อาจแปลได้หลายแบบ
      </p>
    </>
  )
}

function TaksaTable({ day }: { day: TaksaDay }) {
  return (
    <details className="mt-4 rounded-[var(--radius-card)] border border-line bg-surface p-4 shadow-[var(--shadow-card)]">
      <summary className="flex min-h-11 cursor-pointer items-center font-semibold">ดูตารางทักษา 8 หมู่ของวันนี้</summary>
      <table className="mt-2 w-full text-left text-sm">
        <thead className="text-xs text-ink-muted">
          <tr>
            <th scope="col" className="py-1 font-medium">หมู่</th>
            <th scope="col" className="py-1 font-medium">ดาว</th>
            <th scope="col" className="py-1 font-medium">อักษร</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {getTaksaTable(day).map((r) => (
            <tr key={r.role} className={r.role === 'กาลกิณี' ? 'bg-danger-soft/60' : ''}>
              <th scope="row" className="py-2 pr-2 align-top font-medium">
                {r.role}
                <span className="block text-xs font-normal text-ink-muted">{ROLE_MEANINGS[r.role]}</span>
              </th>
              <td className="py-2 pr-2 align-top">{PLANET_LABELS[r.planet]}</td>
              <td className="py-2 align-top leading-loose tracking-wide [overflow-wrap:anywhere]">{r.planet === 'sun' ? 'สระทุกตัว' : spaced(r.letters)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-ink-muted">นับจากดาวประจำวันเกิดเป็น “บริวาร” แล้วนับต่อตามวงทักษา: อาทิตย์ → จันทร์ → อังคาร → พุธ → เสาร์ → พฤหัสบดี → ราหู → ศุกร์</p>
    </details>
  )
}

function CheckName({ day, value, onChange }: { day: TaksaDay; value: string; onChange: (v: string) => void }) {
  const uid = useId()
  const a = value.trim() ? analyzeName(value, day) : null
  return (
    <Card className="mt-4">
      <Field id={`${uid}-check`} label="ตรวจชื่อที่คิดไว้" hint="พิมพ์ชื่อภาษาไทย แอปจะบอกว่าแต่ละตัวอักษรอยู่หมู่ไหน">
        <input
          id={`${uid}-check`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={30}
          placeholder="เช่น ภัทรา"
          aria-describedby={`${uid}-check-hint`}
          className={inputClass}
        />
      </Field>
      {a && (
        <div className="mt-3" aria-live="polite">
          {!a.hasThai ? (
            <p className="text-sm text-ink-muted">ตรวจได้เฉพาะตัวอักษรไทย</p>
          ) : (
            <>
              <p className={`flex items-center gap-2 font-semibold ${a.ok ? 'text-success' : 'text-danger'}`}>
                {a.ok ? <CheckCircleIcon size={22} weight="fill" aria-hidden="true" /> : <WarningCircleIcon size={22} weight="fill" aria-hidden="true" />}
                {a.ok ? 'ไม่มีอักษรกาลกิณี ใช้ได้' : `มีอักษรกาลกิณี: ${a.kalakini.join(' ')}`}
              </p>
              <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="หมู่ของแต่ละตัวอักษร">
                {a.chars.map((c, i) => (
                  <li key={`${c.char}-${i}`} className={`rounded-lg px-2 py-1 text-center text-sm ${ROLE_STYLE[c.role] ?? 'bg-surface-muted text-ink'}`}>
                    <span className="block text-lg font-bold leading-tight">{c.char}</span>
                    <span className="block text-[11px] leading-tight">{c.role}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </Card>
  )
}

function HeartButton({ name, active, onToggle }: { name: string; active: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      aria-label={active ? `เอา ${name} ออกจากชื่อที่ชอบ` : `เก็บ ${name} ไว้ในชื่อที่ชอบ`}
      className={`grid size-11 shrink-0 cursor-pointer place-items-center rounded-full transition-colors duration-150 ${
        active ? 'text-pink hover:bg-primary-soft' : 'text-ink-muted hover:bg-surface-muted'
      }`}
    >
      <HeartIcon size={24} weight={active ? 'fill' : 'regular'} aria-hidden="true" />
    </button>
  )
}

function Favorites({ child, day, onToggle }: { child: Child; day: TaksaDay; onToggle: (name: string) => void }) {
  if (child.favoriteNames.length === 0) return null
  return (
    <section aria-labelledby="fav-names" className="mt-4 rounded-[var(--radius-card)] border border-accent/40 bg-accent-soft/50 p-4">
      <h2 id="fav-names" className="font-semibold">
        ชื่อที่ชอบ ({child.favoriteNames.length})
      </h2>
      <ul className="mt-2 divide-y divide-line">
        {child.favoriteNames.map((n) => {
          const a = analyzeName(n, day)
          const meaning = NAMES.find((x) => x.name === n)?.meaning
          return (
            <li key={n} className="flex items-center gap-2 py-1">
              <span className="min-w-0 flex-1">
                <span className="font-semibold">{n}</span>
                {meaning && <span className="ml-2 text-sm text-ink-muted">{meaning}</span>}
              </span>
              <Badge tone={a.ok ? 'success' : 'danger'}>{a.ok ? 'ผ่าน' : `กาลกิณี ${a.kalakini.join('')}`}</Badge>
              <HeartButton name={n} active onToggle={() => onToggle(n)} />
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function NameList({
  day,
  gender,
  setGender,
  query,
  setQuery,
  favorites,
  onToggle,
}: {
  day: TaksaDay
  gender: NameGender
  setGender: (g: NameGender) => void
  query: string
  setQuery: (q: string) => void
  favorites: string[]
  onToggle: (name: string) => void
}) {
  const uid = useId()
  const total = NAMES.filter((n) => n.gender === gender).length
  const passing = filterNames(day, gender)
  const q = query.trim()
  const shown = q ? passing.filter((n) => n.name.includes(q) || n.meaning.includes(q)) : passing

  return (
    <section aria-labelledby="name-list" className="mt-6">
      <h2 id="name-list" className="text-lg font-semibold">
        ชื่อที่ไม่มีอักษรกาลกิณี
      </h2>
      <p className="text-sm text-ink-muted">
        ผ่าน {passing.length} จาก {total} ชื่อ · ชื่อที่มีอักษรเดชหรือศรีขึ้นก่อน
      </p>
      <div className="mt-3 space-y-3">
        <Segmented<NameGender>
          name={`${uid}-gender`}
          legend="เพศ"
          value={gender}
          onChange={setGender}
          options={[
            { value: 'girl', label: 'ผู้หญิง' },
            { value: 'boy', label: 'ผู้ชาย' },
          ]}
        />
        <div className="relative">
          <label htmlFor={`${uid}-q`} className="sr-only">
            ค้นหาชื่อหรือความหมาย
          </label>
          <MagnifyingGlassIcon size={20} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
          <input
            id={`${uid}-q`}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาชื่อหรือความหมาย เช่น ทรัพย์"
            className={`${inputClass} pl-11`}
          />
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="mt-4 text-sm text-ink-muted">ไม่พบชื่อที่ตรงกับคำค้น ลองพิมพ์คำที่สั้นลง หรือเลือกอักษรเริ่มต้นอื่น</p>
      ) : (
        <ul className="mt-3 divide-y divide-line rounded-[var(--radius-card)] border border-line bg-surface">
          {shown.map((n) => {
            const a = analyzeName(n.name, day)
            return (
              <li key={n.name} className="flex items-center gap-2 px-4 py-2">
                <span className="min-w-0 flex-1">
                  <span className="text-lg font-semibold">{n.name}</span>
                  <span className="block text-sm text-ink-muted">{n.meaning}</span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1">
                  {n.modern && <Badge tone="warning">ยุคนี้</Badge>}
                  {a.hasDechOrSri && <Badge tone="success">มีเดช/ศรี</Badge>}
                </span>
                <HeartButton name={n.name} active={favorites.includes(n.name)} onToggle={() => onToggle(n.name)} />
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
