

<script>
   export let c = ''  
   export let cl = 'grid-cols-1';
   export let w = 'w-full'
   
   switch(c)
   {
     case 'f2':
          cl = 'grid-cols-2'
          w =  'w-[calc(200vw)] sm:w-[calc(200vw-40px)] lg:w-[calc(100vw-40px)] h-full overflow-y-scroll'
          break;
     case 'g1':
          cl="flex-grow grid-cols-2 overflow-y-scroll"     
          break;
     case 's2-l3-x4-w5':
          cl = 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5';
          break;
     case 's2-x4':     
          cl = 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4';
          break;   
     case 's2-x3':     
          cl = 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3';
          break;  
     case '1':
          cl = 'grid-cols-1';
          break;
     //default: Nie ma default. Mozna nadpisać cl i w
   }
</script>    

<div class="grid {cl} mt-0 {w} gap-1">
    <slot/>
</div>
