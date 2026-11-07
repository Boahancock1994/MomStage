/**
 * ไอคอนทั้งแอปมาจาก lucide-react ที่ไฟล์นี้ที่เดียว (ห้ามใช้ emoji แทนไอคอน)
 * ตั้งชื่อตามความหมายที่ใช้ในแอป และรองรับ prop `weight` สำหรับสถานะ
 *   weight="fill" → เติมสีจาง ๆ ภายในเส้น (ยังเห็นรายละเอียดของไอคอน) ใช้กับสถานะ "เลือกอยู่"
 *   weight="bold" → เส้นหนาขึ้น ใช้ในป้ายสถานะเล็ก ๆ
 */
import {
  Ban,
  Baby,
  BriefcaseMedical,
  Calculator,
  CalendarCheck,
  ChartLine,
  Check,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  CircleHelp,
  ClipboardList,
  Clock,
  Copy,
  Droplet,
  Eye,
  Heart,
  HeartPulse,
  History,
  Hospital,
  Hourglass,
  House,
  Image,
  ImagePlus,
  Info,
  ListChecks,
  LocateFixed,
  MapPin,
  MapPinPlus,
  Mars,
  MessageCircle,
  Moon,
  Navigation,
  OctagonAlert,
  PenLine,
  Pencil,
  Phone,
  Pill,
  Plus,
  Puzzle,
  RotateCcw,
  Ruler,
  Scale,
  Search,
  Settings,
  Share,
  Share2,
  Signature,
  Sparkles,
  Sprout,
  Stethoscope,
  Syringe,
  Tag,
  TestTube,
  Thermometer,
  ThumbsDown,
  ThumbsUp,
  Toolbox,
  Trash2,
  TriangleAlert,
  User,
  Users,
  Venus,
  X,
  ArrowLeft,
  type LucideIcon,
  type LucideProps,
} from 'lucide-react'
import type { ComponentType } from 'react'

export interface IconProps extends LucideProps {
  weight?: 'regular' | 'fill' | 'bold'
}

export type Icon = ComponentType<IconProps>

function wrap(Base: LucideIcon, name: string): Icon {
  const Wrapped = ({ weight = 'regular', strokeWidth, ...props }: IconProps) => (
    <Base
      {...props}
      strokeWidth={strokeWidth ?? (weight === 'bold' ? 2.6 : 2)}
      {...(weight === 'fill' ? { fill: 'currentColor', fillOpacity: 0.22 } : {})}
    />
  )
  Wrapped.displayName = name
  return Wrapped
}

export const ArrowCounterClockwiseIcon = wrap(RotateCcw, 'ArrowCounterClockwiseIcon')
export const ArrowLeftIcon = wrap(ArrowLeft, 'ArrowLeftIcon')
export const BabyCarriageIcon = wrap(HeartPulse, 'BabyCarriageIcon') // โหมดตั้งครรภ์
export const BabyIcon = wrap(Baby, 'BabyIcon')
export const CalculatorIcon = wrap(Calculator, 'CalculatorIcon')
export const CalendarCheckIcon = wrap(CalendarCheck, 'CalendarCheckIcon')
export const CaretDownIcon = wrap(ChevronDown, 'CaretDownIcon')
export const CaretRightIcon = wrap(ChevronRight, 'CaretRightIcon')
export const ChartLineIcon = wrap(ChartLine, 'ChartLineIcon')
export const ChatCircleTextIcon = wrap(MessageCircle, 'ChatCircleTextIcon')
export const CheckCircleIcon = wrap(CircleCheck, 'CheckCircleIcon')
export const CheckIcon = wrap(Check, 'CheckIcon')
export const ClipboardTextIcon = wrap(ClipboardList, 'ClipboardTextIcon')
export const ClockCounterClockwiseIcon = wrap(History, 'ClockCounterClockwiseIcon')
export const ClockIcon = wrap(Clock, 'ClockIcon')
export const CopyIcon = wrap(Copy, 'CopyIcon')
export const CrosshairIcon = wrap(LocateFixed, 'CrosshairIcon')
export const DropIcon = wrap(Droplet, 'DropIcon')
export const ExportIcon = wrap(Share, 'ExportIcon')
export const EyeIcon = wrap(Eye, 'EyeIcon')
export const FirstAidIcon = wrap(Thermometer, 'FirstAidIcon')
export const FirstAidKitIcon = wrap(BriefcaseMedical, 'FirstAidKitIcon')
export const GearIcon = wrap(Settings, 'GearIcon')
export const GenderFemaleIcon = wrap(Venus, 'GenderFemaleIcon')
export const GenderMaleIcon = wrap(Mars, 'GenderMaleIcon')
export const HeartIcon = wrap(Heart, 'HeartIcon')
export const HeartbeatIcon = wrap(HeartPulse, 'HeartbeatIcon')
export const HospitalIcon = wrap(Hospital, 'HospitalIcon')
export const HourglassIcon = wrap(Hourglass, 'HourglassIcon')
export const HouseIcon = wrap(House, 'HouseIcon')
export const ImageIcon = wrap(Image, 'ImageIcon')
export const ImageSquareIcon = wrap(ImagePlus, 'ImageSquareIcon')
export const InfoIcon = wrap(Info, 'InfoIcon')
export const ListChecksIcon = wrap(ListChecks, 'ListChecksIcon')
export const MagnifyingGlassIcon = wrap(Search, 'MagnifyingGlassIcon')
export const MapPinIcon = wrap(MapPin, 'MapPinIcon')
export const MapPinPlusIcon = wrap(MapPinPlus, 'MapPinPlusIcon')
export const MoonIcon = wrap(Moon, 'MoonIcon')
export const NavigationArrowIcon = wrap(Navigation, 'NavigationArrowIcon')
export const PencilSimpleIcon = wrap(Pencil, 'PencilSimpleIcon')
export const PencilSimpleLineIcon = wrap(PenLine, 'PencilSimpleLineIcon')
export const PhoneIcon = wrap(Phone, 'PhoneIcon')
export const PillIcon = wrap(Pill, 'PillIcon')
export const PlantIcon = wrap(Sprout, 'PlantIcon')
export const PlusIcon = wrap(Plus, 'PlusIcon')
export const ProhibitIcon = wrap(Ban, 'ProhibitIcon')
export const PuzzlePieceIcon = wrap(Puzzle, 'PuzzlePieceIcon')
export const QuestionIcon = wrap(CircleHelp, 'QuestionIcon')
export const RulerIcon = wrap(Ruler, 'RulerIcon')
export const ScalesIcon = wrap(Scale, 'ScalesIcon')
export const ShareNetworkIcon = wrap(Share2, 'ShareNetworkIcon')
export const SignatureIcon = wrap(Signature, 'SignatureIcon')
export const SparkleIcon = wrap(Sparkles, 'SparkleIcon')
export const StethoscopeIcon = wrap(Stethoscope, 'StethoscopeIcon')
export const SyringeIcon = wrap(Syringe, 'SyringeIcon')
export const TagIcon = wrap(Tag, 'TagIcon')
export const TestTubeIcon = wrap(TestTube, 'TestTubeIcon')
export const ThumbsDownIcon = wrap(ThumbsDown, 'ThumbsDownIcon')
export const ThumbsUpIcon = wrap(ThumbsUp, 'ThumbsUpIcon')
export const ToolboxIcon = wrap(Toolbox, 'ToolboxIcon')
export const TrashIcon = wrap(Trash2, 'TrashIcon')
export const UserIcon = wrap(User, 'UserIcon')
export const UsersThreeIcon = wrap(Users, 'UsersThreeIcon')
export const WarningCircleIcon = wrap(CircleAlert, 'WarningCircleIcon')
export const WarningIcon = wrap(TriangleAlert, 'WarningIcon')
export const WarningOctagonIcon = wrap(OctagonAlert, 'WarningOctagonIcon')
export const XIcon = wrap(X, 'XIcon')
