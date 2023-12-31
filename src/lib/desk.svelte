<script>
    import HorizontalToolbar from './horizontal.toolbar.svelte'
    import VerticalToolbar from './vertical.toolbar.svelte'
    import Configurable from './internal/configurable.content.svelte'
    import Operations from './operations.svelte'
    import Fab from './components/Fab.svelte'
        
    import {main_sidebar_visible_store, 
            tools_visible_store, 
            bottom_bar_visible_store, 
            auto_hide_sidebar,
            has_selected_item,
            dark_mode_store,
            data_tick_store,
            set_default_tools_visible,
            set_dark_mode_default } from './stores.js'
    
    import { AuthorizedView} from '@humandialog/auth.svelte'
    import { handle_select, is_device_smaller_than } from './utils'
	import { onMount } from 'svelte';
    
    export let layout;

    onMount( () => {
        window.addEventListener('resize', on_resize)
        return () => {
            window.removeEventListener('resize', on_resize)
        }
    })

    function on_resize()
    {
        auto_hide_sidebar();
    }

    const sizes = {
            bottom: 240,
            toolbar: 40,
            operations: 40,
            sidebar: 320
        }

    $: outerWidth = 0
    $: innerWidth = 0
    $: outerHeight = 0
    $: innerHeight = 0

    const media_break_sm = 640; //px	@media (min-width: 640px) { ... }
    const media_break_md = 768; //px	@media (min-width: 768px) { ... }
    const media_break_lg = 1024; //px	@media (min-width: 1024px) { ... }
    const media_break_xl = 1280; //px	@media (min-width: 1280px) { ... }
    const media_break_2xl = 1536; //px
    let test = "ala\n    ma\n\tkota"

    $: is_small = is_device_smaller_than("sm")
    
    let main_side_panel_visibility = "hidden"
    let lg_content_area_horizontal_dim = ""
    
    let visible_sidebar = "*"

    if(layout.dark != undefined)
    {
        if(layout.dark.optional)
            layout.mainToolbar.darkMode = true;

        if(layout.dark.default)
            set_dark_mode_default(layout.dark.default)
    }

    if(layout.operations != undefined)
    {
        if(layout.operations.optional)
            layout.mainToolbar.operations = true;

        if(layout.operations.default)
            set_default_tools_visible(layout.operations.default)
    }
    
    $: { visible_sidebar = $main_sidebar_visible_store
        
        if(visible_sidebar == "*")
        {
            main_side_panel_visibility = "hidden"
            lg_content_area_horizontal_dim = ""
        }
        else
        {
            main_side_panel_visibility = "lg:block"
            lg_content_area_horizontal_dim = `lg:left-[360px] lg:w-[calc(100vw-360px)]`
        }      
    }
    
    let tools_visibility = "hidden"
    let tools_visible = false
    let bottom_bar_visibility = "hidden"
    let bottom_bar_visible = false
    let lg_main_sidebar_height = ""
    let fab_bottom = "bottom-0"
                                
    let content_top = ""
    let content_height = ""                                
    
    $: { tools_visible = $tools_visible_store
        bottom_bar_visible = $bottom_bar_visible_store
        let dts = $data_tick_store;

        if(!has_selected_item())
            bottom_bar_visible = false;

        if(tools_visible)
        {
            tools_visibility = "fixed"

            if(is_small)
                content_top = `top-[80px] sm:top-[40px]`
            else
                content_top = `top-[80px] sm:top-[40px]`
            
            if(bottom_bar_visible)
                content_height = `h-[calc(100vh-320px)] sm:h-[calc(100vh-280px)]`    
            else    
                content_height = `h-[calc(100vh-80px)] sm:h-[calc(100vh-40px)]` 
               
        }
        else
        {
            tools_visibility = "hidden"
            content_top = `top-[40px] sm:top-0`
            if(bottom_bar_visible)
                content_height = `h-[calc(100vh-280px)] sm:h-[calc(100vh-240px)]`           
            else
                content_height = `h-[calc(100vh-40px)] sm:h-screen`
        }
        
        
        
        if(bottom_bar_visible)
        {
            lg_main_sidebar_height = `lg:h-[calc(100vh-240px)]`    
            bottom_bar_visibility = "fixed"
            fab_bottom = `bottom-[240px]`;
        }
        else
        {    
            lg_main_sidebar_height = ""
            bottom_bar_visibility = "hidden"
            fab_bottom = "bottom-0"
        }
        
    }
    
    
    
   
    
    //$: screen.width = innerWidth;  
</script>

<svelte:window bind:innerWidth bind:outerWidth bind:innerHeight bind:outerHeight />

<AuthorizedView>
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div    id="__hd_svelte_layout_root" class="{$dark_mode_store}"
            on:click={handle_select} 
            on:contextmenu={handle_select}>

        <div class="bg-white dark:bg-gray-900 dark:text-white      min-h-screen h-screen">    
            <!--###########################################################-->
            <!--##  HORIZONTAL TOOLBAR (FOR PHONES)  ######################-->
            <!--###########################################################-->
            <header class="fixed sm:hidden w-screen top-0 h-[40px] z-50  overflow-auto shadow  shadow-slate-900/5 dark:shadow-none" >
                    <div class=" flex flex-row justify-between    bg-slate-900   text-gray-100 ">
                        <HorizontalToolbar app_config={layout}/>
                    <div>
            </header>        


            <!--HorizontalToolbar /-->
            <!--#######################################################-->
            <!--##  VERTICAL TOOLBAR                 ##################-->
            <!--#######################################################-->
            <div  class="hidden sm:block fixed left-0 top-0 w-[40px] h-screen z-20 inset-0   overflow-hidden">
                <div class="sticky top-0 flex h-full w-10 bg-slate-900 flex-col items-center text-gray-100 shadow">
                    <VerticalToolbar app_config={layout}/>
                </div>    
            </div>

            <!--VerticalToolbar /-->

            <!--#######################################################-->
            <!--##  MAIN SIDE BAR                    ##################-->
            <!--#######################################################-->
            <div  class="{main_side_panel_visibility} fixed 
                            left-0  sm:left-[40px]
                            top-[40px]  sm:top-0 
                            h-[calc(100vh-40px)] sm:h-full {lg_main_sidebar_height}
                            w-screen sm:w-[320px] 
                            z-10 overflow-x-hidden">

                <div class=" bg-slate-50 w-full h-full dark:bg-slate-800 overflow-y-auto py-4 px-0">
                    <Configurable config={layout.sidebar[visible_sidebar]}>
                        <div slot='alt'></div>
                    </Configurable>
                </div>
            </div>    
            <!--###########################################################-->
            <!--##  HORIZONTAL TOOLS                 ######################-->
            <!--###########################################################-->

            <div  class="   {tools_visibility} 
                            w-screen sm:w-[calc(100vw-40px)] 
                            h-[40px] 
                            left-0 sm:left-[40px]     
                            top-[40px] sm:top-0
                            {lg_content_area_horizontal_dim}
                            z-0 overflow-hidden " >

                <Operations/>
            </div>

            <div class="!hidden {tools_visibility} right-3 {fab_bottom} mb-1 cursor-pointer z-20">
                <Fab/>
            </div>

            <!--#######################################################-->
            <!--##  CONTENT                          ##################-->
            <!--#######################################################-->
            <div  class="fixed left-0  w-screen  
                            sm:left-[40px]  sm:w-[calc(100vw-40px)]    
                            {content_top}
                            {content_height}
                            {lg_content_area_horizontal_dim}
                            z-0 overflow-x-hidden" 
                            
                            on:click={(e) => auto_hide_sidebar() } 
                            on:keydown={(e) => auto_hide_sidebar()}>
                    <Configurable config={layout.mainContent}>
                        <div slot='alt'></div>
                    </Configurable>
            </div>    



            <!--###########################################################-->
            <!--##  BOTTOM SIDEBAR          ###############################-->
            <!--###########################################################-->

            <div  class="{bottom_bar_visibility} left-0 bottom-0 w-screen h-[240px] z-10 overflow-y-hidden overflow-x-auto 
                        sm:left-[40px] sm:w-[100vw-40px] " >
                    <Configurable config={layout.selectionDetails} >
                        <div slot="alt"></div>
                    </Configurable>
                
            </div>    
        </div>
    </div>
</AuthorizedView>