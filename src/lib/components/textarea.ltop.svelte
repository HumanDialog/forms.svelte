<script>
    export let label = 'lbl'
    export let placeholder = 'Ex. Audi'
    export let val = ''
    export let sy = 'm'
   
    export let r = 5;
       
    export  let s = 'sm'
    let     label_mb = '' //
    let     input_p = ''
    
    switch (s)
    {
        case 'md':
            label_mb = 'mb-2';
            input_p = 'pt-2.5 pb-2.5'
            break;
        default:
            label_mb = 'mb-1'
            input_p = 'pt-0.5 pb-1'    
            break;
            
            
    }
    
    export let c='4-8'
    let col_span = ''
    switch (c)
    {
        case '4-4':
            col_span = 'col-span-4';
            break;
        case '4-8':
            col_span = 'col-span-4 sm:col-span-8';
            break;
        case '4-8-12':
            col_span = 'col-span-4 sm:col-span-8 xl:col-span-12';
            break;
        default:
            col_span = 'col-span-4 sm:col-span-8 xl:col-span-12';
            break;
    }       
    
</script>    

<div class="{col_span}">
    <label for="name" class="block {label_mb} text-xs font-small text-gray-900 dark:text-white">{label}</label>
    <textarea id="description" rows="5" 
    class="block {input_p} w-full text-sm text-gray-900 bg-gray-50 
    rounded-lg border border-gray-300 focus:ring-primary-500 focus:border-primary-500
     dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white 
     dark:focus:ring-primary-500 dark:focus:border-primary-500" 
     placeholder={placeholder}>{val}</textarea>                    
</div>