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
            hasSelectedItem,
            dark_mode_store,
            data_tick_store,
            set_default_tools_visible,
            set_dark_mode_default,
            sidebar_left_pos,
            wholeAppReloader } from './stores.js'
    
    import { AuthorizedView} from '@humandialog/auth.svelte'
    import { handleSelect, isDeviceSmallerThan } from './utils'
	import { afterUpdate, onMount } from 'svelte';
    
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

    $: is_small = isDeviceSmallerThan("sm")
    
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

    if(layout.operations !== undefined)
    {
        if(layout.operations.optional)
            layout.mainToolbar.operations = true;

        if(layout.operations.default !== undefined)
            set_default_tools_visible(layout.operations.default, !layout.operations.optional)
    }
    else
        set_default_tools_visible(false, true)

    //let autoRedirectToSignIn = layout.autoRedirectToSignIn ?? true

    $: { visible_sidebar = $main_sidebar_visible_store
        
        if(visible_sidebar == "*")
        {
            main_side_panel_visibility = "hidden"
            lg_content_area_horizontal_dim = ""
        }
        else
        {
            main_side_panel_visibility = "fixed lg:block"
            lg_content_area_horizontal_dim = `lg:left-[360px] lg:w-[calc(100vw-360px)]`
        }      
    }
    
    let tools_visibility = "hidden"
    let tools_visible = false
    let bottom_bar_visibility = "hidden"
    let bottom_bar_visible = false
    let lg_main_sidebar_height = ""
    let fab_visibility = "hidden"
    let fab_bottom = "bottom-0"
                                
    let content_top = ""
    let content_height = ""                                
    
    $: { tools_visible = $tools_visible_store
        bottom_bar_visible = $bottom_bar_visible_store
        let dts = $data_tick_store;

        //if(!hasSelectedItem())
        //    bottom_bar_visible = false;

        if(tools_visible)
        {
            tools_visibility = "hidden sm:block sm:fixed"
            fab_visibility = "fixed sm:hidden"

            content_top = 'top-[50px] sm:top-[40px]'
            
            if(bottom_bar_visible)
                content_height = `h-[calc(100vh-290px)] sm:h-[calc(100vh-280px)]`    
            else    
                content_height = `h-[calc(100vh-50px)] sm:h-[calc(100vh-40px)]` 
               
        }
        else
        {
            tools_visibility = "hidden"
            content_top = `top-[50px] sm:top-0`
            if(bottom_bar_visible)
                content_height = `h-[calc(100vh-290px)] sm:h-[calc(100vh-240px)]`           
            else
                content_height = `h-[calc(100vh-50px)] sm:h-screen`
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

<!--AuthorizedView {autoRedirectToSignIn}-->
    
    {#key $wholeAppReloader}
    
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div    id="__hd_svelte_layout_root" class="{$dark_mode_store}"
                on:click={handleSelect} 
                on:contextmenu={handleSelect}>

            <div class="bg-white dark:bg-stone-900 dark:text-white  overflow-x-clip overflow-y-clip  h-screen">    
                <!--###########################################################-->
                <!--##  HORIZONTAL TOOLBAR (FOR PHONES)  ######################-->
                <!--###########################################################-->
                <header class="fixed sm:hidden w-screen top-0 h-[50px] sm:h-[40px] z-20 shadow  shadow-stone-900/5 dark:shadow-none     overflow-auto" >
                        <div class=" flex flex-row justify-between  h-full  bg-stone-950   text-stone-100 ">
                            <HorizontalToolbar appConfig={layout}/>
                        <div>
                </header>        


                <!--HorizontalToolbar /-->
                <!--#######################################################-->
                <!--##  VERTICAL TOOLBAR                 ##################-->
                <!--#######################################################-->
                <div  class="hidden sm:block fixed left-0 top-0 w-[50px] sm:w-[40px] h-screen z-20 inset-0   overflow-hidden">
                    <div class="sticky top-0 flex h-full w-10 bg-stone-800 dark:bg-stone-950 flex-col items-center text-stone-100 shadow">
                        <VerticalToolbar appConfig={layout}/>
                    </div>    
                </div>

                <!--VerticalToolbar /-->

                <!--#######################################################-->
                <!--##  MAIN SIDE BAR                    ##################-->
                <!--#######################################################-->
                {#if true}
                {@const sidebar_left = $sidebar_left_pos==0 ? "left-0" : "left-[50px]"}
                {@const sidebar_small_width = $sidebar_left_pos==0 ? "w-full" : "w-[calc(100vw-50px)]"}

                <div  class="{main_side_panel_visibility}  
                                {sidebar_left}  sm:left-[40px]
                                top-[50px]  sm:top-0 
                                h-[calc(100vh-50px)] sm:h-full {lg_main_sidebar_height}
                                {sidebar_small_width} sm:w-[320px] 
                                z-20 overflow-x-hidden">

                    <div class=" bg-stone-50 w-full h-full dark:bg-stone-800 overflow-y-auto py-0 px-0">
                        <Configurable config={layout.sidebar[visible_sidebar]}>
                            <div slot='alt'></div>
                        </Configurable>
                    </div>
                </div>    
                {/if}

                <!-- ! below overflow-x-clip prevents horizontal scrollbar when vertical scrollbar is visible. Default
                    behaviour is the content expand vertically, and only vertical scrollbar can be visible.
                    When content on the main page needs to be expanded horizontally (like kanban chart for example) then
                    that component should define overflow-x-* itself -->
                <section on:click|capture={auto_hide_sidebar} class="">

                    <!--###########################################################-->
                    <!--##  HORIZONTAL TOOLS                 ######################-->
                    <!--###########################################################-->

                    <div  class="   {tools_visibility} 
                                    w-screen sm:w-[calc(100vw-40px)] 
                                    h-[40px] 
                                    left-0 sm:left-[40px]     
                                    top-[40px] sm:top-0
                                    {lg_content_area_horizontal_dim}
                                    z-10 overflow-hidden " >

                        <Operations/>
                    </div>

                    <div class="{fab_visibility} right-3 {fab_bottom} mb-1 cursor-pointer z-10">
                        <Fab/>
                    </div>

                    <!--#######################################################-->
                    <!--##  CONTENT                          ##################-->
                    <!--#######################################################-->
                    <!-- fixed => relative, content-height => min content height -- -->
                    <div    id="__hd_svelte_main_content_container"
                            class="relative left-0  w-screen  
                                    sm:left-[40px]  sm:w-[calc(100vw-40px)]    
                                    {content_top}
                                    {content_height}
                                    {lg_content_area_horizontal_dim}
                                    z-0 overflow-x-hidden overflow-y-auto" 
                                    >
                            <Configurable config={layout.mainContent} min_h_class="min-h-full">
                                <div slot='alt'></div>
                            </Configurable>
                    </div>    



                    <!--###########################################################-->
                    <!--##  BOTTOM SIDEBAR          ###############################-->
                    <!--###########################################################-->

                    <div  class="{bottom_bar_visibility} left-0 bottom-0 w-screen h-[240px] z-20 overflow-y-hidden overflow-x-auto 
                                sm:left-[40px] sm:w-[100vw-40px] " >
                            <Configurable config={layout.selectionDetails} >
                                <div slot="alt"></div>
                            </Configurable>
                        
                    </div>    

                    <!-- #########################################################-->
                    <!-- ## MODAL DIALOG #########################################-->
                    <!-- #########################################################-->
                    <div id="__hd_svelte_modal_root" class="z-30">
                        <!-- after <Modal/> component is shown it's rettached to above div
                            see: modal.svelte afterUpdate -->
                    </div>

                </section>

            </div>
        </div>
    {/key}
<!--/AuthorizedView-->

<style lang="scss">

    #__hd_svelte_layout_root {
        /* width */
        ::-webkit-scrollbar {
            width: 10px;
        }

        /* Track */
        ::-webkit-scrollbar-track {
        background: #FAFAF9;
        }

        /* Handle */
        ::-webkit-scrollbar-thumb {
        background: #E7E5E4;
        }

        /* Handle on hover */
        ::-webkit-scrollbar-thumb:hover {
        background: #D6D3D1;
        }
    }

    #__hd_svelte_layout_root.dark {
        
        /* width */
        ::-webkit-scrollbar {
            width: 10px;
        }

        /* Track */
        ::-webkit-scrollbar-track {
        background: #292524;
        }

        /* Handle */
        ::-webkit-scrollbar-thumb {
        background: #44403c;
        }

        /* Handle on hover */
        ::-webkit-scrollbar-thumb:hover {
        background: #57534e;
        }
    }

    /* bg-white */
    :global(body)
    {
      --tw-bg-opacity: 1;
      background-color: rgb(255 255 255 / var(--tw-bg-opacity));
    }
  
    /* dark:bg-gray-900 */
    :global(body.dark)
    {
      --tw-bg-opacity: 1;
      background-color: rgb(28 25 23 / var(--tw-bg-opacity));
      
    }
    
</style>