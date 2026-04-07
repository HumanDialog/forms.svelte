<script>
  export let w = 24;
  export let h = 24;
  export let s = 2;
  
  export let size = "n";

  switch (size)
  {
    case "xs":
      w = 16;
      h = 16;
      break;
    case "s":
      w = 16;
      h = 16;
      break;
  case "l":
      w = 28;
      h = 28;
      break;

  }


</script>


<svg xmlns="http://www.w3.org/2000/svg" width={w} height={h} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width={s} stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-check-icon lucide-circle-check"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>