<svelte:options accessors={true}/>
<script lang="ts">
    import {icons} from '../utils.js'

    // use one of those
    export let component = null;                            // svelte component
    export let module_name :string = "fa/FaQuestion";       // name of module file with icon component -> icon will be loaded dynamically
    export let img :string = '';                            // url to img like png or jpg
    export let label :string = '';                           // initials will be shown generated from 'label' string
    export let symbol :string = '';                         // predefined html particle from icons app map
    export let color:string = '';

    export let size :number = 5;                            
    export let bg :string = '';                             // In case of initials mode it can be automatically generated from 'label' hash
    export let circle :boolean = false;                     
    
    let additional_class = $$restProps.class ?? '';
    let _bg;
    
    let txt :string = '';
    let symbol_html :string = '';

    let icon_size :string = `${size*0.25}rem`;
    
    $:
    {   
        if(symbol)
        {
            if(symbol.startsWith('label:'))
                label = symbol.substring(6);
            else if(symbol.startsWith('color:'))
                color = symbol.substring(6);
            else if(symbol.startsWith('img:'))
                img = symbol.substring(4);
            else if(icons && icons.symbols && icons.symbols.has(symbol))
                symbol_html = icons.symbols.get(symbol);
            
        }
        
        if(img)
        {
            img = img;
            txt = '';
            _bg = bg;
        }
        else if(label)
        {
            label = label;
            bg = bg;
            if(!bg)
            {
                let saturation = 100;
                let lightness = 75
                let hash = 0;
                for (let i = 0; i < label.length; i++) 
                {
                    hash = label.charCodeAt(i) + ((hash << 5) - hash);
                    hash = hash & hash;
                }
                _bg = `hsl(${(hash % 360)}, ${saturation}%, ${lightness}%)`;
            }
            else
                _bg = bg;

            let arr = label.split(' ');
            if(arr.length > 0)
            {
                txt = arr[0].substring(0, 1).toUpperCase();
                if(arr.length > 1)
                    txt += arr[arr.length-1].substring(0, 1).toUpperCase();
            }
        }
        else if(color)
        {
            _bg = color;
        }
        else if(symbol)
        {

        }
        else if(!component)
        {
            
        }
        else
            component = component
    }
</script>

<div class=" {additional_class}"
    style:width={icon_size} 
    style:height={icon_size} 
    style:background-color={_bg}
    style:border-radius={ circle ? '50%' : ''}
    on:blur
    on:click
    on:focus
    on:keydown
    on:keypress
    on:keyup
    on:mouseenter
    on:mouseleave
    on:mouseover >
    {#if component != null}
        <svelte:component this={component} />
    {:else if txt}
        <div   class="m-0 p-0 font-sans font-bold flex flex-col justify-center text-center w-full h-full text-slate-900"
               style:font-size={`${size/8}rem`}
               >
            <div>{txt}</div>
        </div>
    {:else if img}
        <img src={img} class="w-full max-w-full h-full max-h-full" alt='img'/>
    {:else if symbol_html}
        {@html symbol_html}
    {/if}
</div>

<style>
  svg {
    stroke: currentColor;
    fill: currentColor;
    stroke-width: 0;
    width: 100%;
    height: auto;
    max-height: 100%;
  }  

</style>