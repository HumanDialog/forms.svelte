<script>
  export let icon = '';

  export let size = "n";

  export let xs = false;
  export let s = false;
  export let l = false;
  export let xl = false;

  import Folder from './ricons/folder.svelte'

  import Turtle from './ricons/turtle.svelte'
  import Cat from './ricons/cat.svelte'
  import ChessRook from './ricons/chess-rook.svelte'
  import ClipboardMinus from './ricons/clipboard-minus.svelte'
  import ClipboardList from './ricons/clipboard-list.svelte'
  import ClipboardPenLine from './ricons/clipboard-pen-line.svelte'

  import ChevronDown from './ricons/chevron-down.svelte'
  import ChevronLeft from './ricons/chevron-left.svelte'
  import ChevronLeftRight from './ricons/chevrons-left-right.svelte'
  import ChevronRight from './ricons/chevron-right.svelte'
  import ChevronUp from './ricons/chevron-up.svelte'
  import ChevronUpDown from './ricons/chevrons-up-down.svelte'
  import ChevronsDown from './ricons/chevrons-down.svelte'
  import ChevronsLeft from './ricons/chevrons-left.svelte'
  import ChevronsRight from './ricons/chevrons-right.svelte'
  import ChevronsUp from './ricons/chevrons-up.svelte'

  import FileText from './ricons/file-text.svelte'
  import FileArchive from './ricons/file-archive.svelte'
  import Upload  from './ricons/upload.svelte'
  import Download from './ricons/download.svelte'

  import User  from './ricons/user.svelte'
  import Users  from './ricons/users.svelte'


  import SquarePen from './ricons/square-pen.svelte'
  import SquareCheckBig from './ricons/square-check-big.svelte'

  import MssagesSquare from './ricons/messages-square.svelte'
  import Mssagesquare from './ricons/message-square.svelte'
  import Package from './ricons/package.svelte'
  import Calendar from './ricons/calendar.svelte'
  import Calendars from './ricons/calendars.svelte'
  import Notebook from './ricons/notebook.svelte'
  import Square from './ricons/square.svelte'
  import ArrowUp from './ricons/arrow-up.svelte'
  import CheckCheck from './ricons/check-check.svelte'
  import X from './ricons/x.svelte'
  import EllipsisVertical from './ricons/ellipsis-vertical.svelte'

  import CircleDotDashed from './ricons/circle-dot-dashed.svelte'
  import CircleDashed from './ricons/circle-dashed.svelte'

  import Pencil from './ricons/pencil.svelte'

  import Bold from './ricons/bold.svelte'
  import Italic from './ricons/italic.svelte'
  import Underline from './ricons/underline.svelte'
  import Strikethrough  from './ricons/strikethrough.svelte'
  import Pilcrow from './ricons/pilcrow.svelte'
  import CodeXml from './ricons/code-xml.svelte'
  import TextQuote from './ricons/text-quote.svelte'

  import Paperclip from './ricons/paperclip.svelte'
  import Image from './ricons/image.svelte'
  import Table from './ricons/table.svelte'
  import Tag from './ricons/tag.svelte'
  import Minus from './ricons/minus.svelte'
  import Save from './ricons/save.svelte'

  import Heading1 from './ricons/heading-1.svelte'
  import Heading2 from './ricons/heading-2.svelte'
  import Heading3 from './ricons/heading-3.svelte'
  import Heading4 from './ricons/heading-4.svelte'
  import Heading5 from './ricons/heading-5.svelte'
  import List from './ricons/list.svelte'
  import ListOrdered from './ricons/list-ordered.svelte'
  import ListChecks from './ricons/list-checks.svelte'
  import ListPlus from './ricons/list-plus.svelte'
  import ListMinus from './ricons/list-minus.svelte'
 
  import LoaderCircle from './ricons/loader-circle.svelte' 
  import Check from './ricons/check.svelte'

  let ricons_box = {
    "arrow-up": ArrowUp,
    "check-check": CheckCheck,
    "folder": Folder,
    "square-pen": SquarePen,
    "square-check-big": SquareCheckBig,
    "clipboard-pen-line": ClipboardPenLine,
    "turtle": Turtle,
    "cat": Cat,
    "chess-rook": ChessRook,
    "clipboard-minus": ClipboardMinus,
    "clipboard-list": ClipboardList,

    "chevron-down": ChevronDown,
    "chevron-left": ChevronLeft,
    "chevron-right": ChevronRight,
    "chevron-up": ChevronUp,

    "chevrons-left-right": ChevronLeftRight,
    "chevrons-up-down": ChevronUpDown,

    "chevrons-down": ChevronsDown,
    "chevrons-left": ChevronsLeft,
    "chevrons-right": ChevronsRight,
    "chevrons-up": ChevronsUp,

    "user": User,
    "users": Users,

    "file-text": FileText,
    "file-archive": FileArchive,

    "upload": Upload,
    "download": Download,

    "messages-square": MssagesSquare,
    "message-square": Mssagesquare,
    "package": Package,
    "calendar": Calendar,
    "calendars": Calendars,
    "notebook": Notebook,
    "square": Square,
    "x":  X,

    "ellipsis-vertical": EllipsisVertical,
    "circle-dot-dashed": CircleDotDashed,
    "circle-dashed": CircleDashed,

    "pencil": Pencil,

    'bold': Bold,
    'italic': Italic,
    'underline': Underline,
    'strikethrough': Strikethrough,

    'pilcrow': Pilcrow,
    'code-xml': CodeXml,
    'text-quote': TextQuote,

    'save': Save,

    'heading-1': Heading1,
    'heading-2': Heading2,
    'heading-3': Heading3,
    'heading-4': Heading4,
    'heading-5': Heading5,
    'list': List,

    'paperclip': Paperclip,
    'image': Image,
    'table': Table,
    'tag': Tag,
    'minus': Minus,

    'loader-circle': LoaderCircle,
    'check': Check
  }

  let width = 24;
  let height = 24;
  let stroke = 2;

  if(xs)
  {
      width = 16;
      height = 16;
  }
  else if(s)
  {
      width = 20;
      height = 20;
      stroke = 1
  }
  else if(l)
  {
      width = 28;
      height = 28;
  }
  else if(xl)
  {
      width = 32;
      height = 32;
  }


  switch (size)
  {
    case "xs":
      width = 16;
      height = 16;
      break;
    case "s":
      width = 20;
      height = 20;
      break;
  case "l":
      width = 28;
      height = 28;
      break;
  case "xl":
      width = 32;
      height = 32;
      break;

  }

</script>

<svelte:component this={ricons_box[icon]} w={width} h={height} s={stroke}/>
