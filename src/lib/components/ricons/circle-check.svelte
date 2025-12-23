<script>
  export let size = "n";

  let width = 24;
  let height = 24;

  switch (size)
  {
    case "xs":
      width = 16;
      height = 16;
      break;
    case "s":
      width = 16;
      height = 16;
      break;
  case "l":
      width = 28;
      height = 28;
      break;

  }


</script>


<svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-check-icon lucide-circle-check"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>