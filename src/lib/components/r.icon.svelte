<script>
  export let icon = "turtle";

  export let size = "n";

  export let xs = false;
  export let sm = false;

  import Folder from './ricons/folder.svelte'

  import Turtle from './ricons/turtle.svelte'
  import Cat from './ricons/cat.svelte'
  import ChessRook from './ricons/chess-rook.svelte'
  import ClipboardMinus from './ricons/clipboard-minus.svelte'
  import ClipboardList from './ricons/clipboard-list.svelte'
  import ClipboardPenLine from './ricons/clipboard-pen-line.svelte'
  import ChevronDown from './ricons/chevron-down.svelte'

  import SquarePen from './ricons/square-pen.svelte'
  import SquareCheckBig from './ricons/square-check-big.svelte'
  import FileText from './ricons/file-text.svelte'
  import MssagesSquare from './ricons/messages-square.svelte'
  import Mssagesquare from './ricons/message-square.svelte'
  import Package from './ricons/package.svelte'
  import Calendar from './ricons/calendar.svelte'
  import Calendars from './ricons/calendars.svelte'
  import Notebook from './ricons/notebook.svelte'
  import Square from './ricons/square.svelte'

  let ricons_box = {
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
    "file-text": FileText,
    "messages-square": MssagesSquare,
    "message-square": Mssagesquare,
    "package": Package,
    "calendar": Calendar,
    "calendars": Calendars,
    "netebook": Notebook,
    "square": Square
  }

  let width = 24;
  let height = 24;
  let stroke = 2;

  if(xs)
  {
      width = 16;
      height = 16;
  }
  else if(sm)
  {
      width = 20;
      height = 20;
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
