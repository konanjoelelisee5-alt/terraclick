import type { CSSProperties } from "react";
import {
  Ambulance,
  BedDouble,
  Bell,
  Bot,
  Briefcase,
  Brush,
  Bug,
  Building2,
  Calendar,
  Camera,
  Car,
  Check,
  ChevronDown,
  CircleHelp,
  ClipboardCheck,
  Cpu,
  Download,
  Droplets,
  FileSignature,
  FileText,
  Flame,
  GraduationCap,
  HandHelping,
  HardHat,
  Heart,
  HeartPulse,
  Home,
  Image,
  Info,
  Landmark,
  LayoutGrid,
  ListChecks,
  LocateFixed,
  Lock,
  Mail,
  Map,
  MapPin,
  MessageCircle,
  MessageSquare,
  Mic,
  Monitor,
  Paperclip,
  PenLine,
  Phone,
  Pill,
  Receipt,
  Route,
  Scale,
  ScanSearch,
  Search,
  Send,
  Shield,
  ShieldCheck,
  Shirt,
  ShoppingBasket,
  Siren,
  Snowflake,
  Sprout,
  Star,
  Sun,
  Timer,
  Trash2,
  TriangleAlert,
  UploadCloud,
  User,
  Users,
  Wallet,
  Wind,
  Wrench,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";

/* Le design system impose Lucide, en trait 1.75, jamais rempli — à la seule
   exception des étoiles de notation, remplies en Soleil. Aucun emoji, aucun
   glyphe unicode détourné en icône. */
const ICONES: Record<string, LucideIcon> = {
  "alert-triangle": TriangleAlert,
  ambulance: Ambulance,
  "bed-double": BedDouble,
  bell: Bell,
  bot: Bot,
  briefcase: Briefcase,
  brush: Brush,
  bug: Bug,
  "building-2": Building2,
  calendar: Calendar,
  camera: Camera,
  car: Car,
  check: Check,
  "chevron-down": ChevronDown,
  "circle-help": CircleHelp,
  "clipboard-check": ClipboardCheck,
  cpu: Cpu,
  download: Download,
  droplets: Droplets,
  "file-signature": FileSignature,
  "file-text": FileText,
  flame: Flame,
  "graduation-cap": GraduationCap,
  "hand-helping": HandHelping,
  "hard-hat": HardHat,
  heart: Heart,
  "heart-pulse": HeartPulse,
  home: Home,
  image: Image,
  info: Info,
  landmark: Landmark,
  "layout-grid": LayoutGrid,
  "list-checks": ListChecks,
  "locate-fixed": LocateFixed,
  lock: Lock,
  mail: Mail,
  map: Map,
  "map-pin": MapPin,
  "message-circle": MessageCircle,
  "message-square": MessageSquare,
  mic: Mic,
  monitor: Monitor,
  paperclip: Paperclip,
  "pen-line": PenLine,
  phone: Phone,
  pill: Pill,
  receipt: Receipt,
  route: Route,
  scale: Scale,
  "scan-search": ScanSearch,
  search: Search,
  send: Send,
  shield: Shield,
  "shield-check": ShieldCheck,
  shirt: Shirt,
  "shopping-basket": ShoppingBasket,
  siren: Siren,
  snowflake: Snowflake,
  sprout: Sprout,
  star: Star,
  sun: Sun,
  timer: Timer,
  "trash-2": Trash2,
  "upload-cloud": UploadCloud,
  user: User,
  users: Users,
  wallet: Wallet,
  wind: Wind,
  wrench: Wrench,
  x: X,
  zap: Zap,
};

export type NomIcone = keyof typeof ICONES;

type Props = {
  name: string;
  /** Taille en pixels, appliquée en largeur et en hauteur. */
  size?: number;
  strokeWidth?: number;
  color?: string;
  fill?: string;
  style?: CSSProperties;
  className?: string;
};

export function Icon({ name, size = 18, strokeWidth = 1.75, color, fill = "none", style, className }: Props) {
  const Glyphe = ICONES[name];
  if (!Glyphe) return null;
  return (
    <Glyphe
      width={size}
      height={size}
      strokeWidth={strokeWidth}
      color={color}
      fill={fill}
      absoluteStrokeWidth={false}
      className={className}
      style={{ flex: "none", ...style }}
      aria-hidden="true"
    />
  );
}
