

<script>
    export let c = ''  
    export let cl = 'grid-cols-1';
    
    switch(c)
    {
      case '1':
           //cl = 'grid-cols-1'; already set 
           break;
      case '2':
           cl = 'grid-cols-2';
           break;
      case '3':
           cl = 'grid-cols-3';
           break;
      //default: Nie ma default. Mozna nadpisać cl
    }
 </script>    
 
 <div class="{cl} mt-4 gap-4 bg-slate-500">
     <slot/>
 </div>
 