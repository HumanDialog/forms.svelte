<script>
    import HorizontalToolbar from './horizontal.toolbar.svelte'
    import VerticalToolbar from './vertical.toolbar.svelte'
    import HorizontalNavigatorTabs from './horizontal.nav.tabs.svelte'
    import Configurable from './internal/configurable.content.svelte'
    import Operations from './operations.svelte'
    import Fab from './components/Fab.svelte'
     import {Alert} from 'flowbite-svelte'

    import {main_sidebar_visible_store,
            tools_visible_store,
            bottom_bar_visible_store,
            hasSelectedItem,
            dark_mode_store,
            data_tick_store,
            set_default_tools_visible,
            set_dark_mode_default,
            sidebar_left_pos,
            wholeAppReloader,
            alerts, removeAlert, showFABAlways} from './stores.js'
    import {pushChanges} from './updates.js'

    //import { AuthorizedView} from '@humandialog/auth.svelte'
    import { handleSelect, isDeviceSmallerThan, isOnScreenKeyboardVisible, navGetMode, removeAt, UI, NAV_MODE_SIDEBAR, navAutoHide, navIsVisible } from './utils'
    import { afterUpdate, onMount } from 'svelte';
    import {location} from 'svelte-spa-router'
    import {FaCopy, FaTimes} from 'svelte-icons/fa'

    export let layout;

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
    let lg_content_area_horizontal_tools_dim = ""

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
        const navMode = navGetMode()
        if(navMode == NAV_MODE_SIDEBAR)
        {
            if(visible_sidebar == "*")
            {
                main_side_panel_visibility = "hidden"
                lg_content_area_horizontal_dim = ""
                lg_content_area_horizontal_tools_dim = `sm:left-[60px] sm:w-[calc(100vw-80px)]`
            }
            else
            {
                main_side_panel_visibility = "fixed lg:block"
                lg_content_area_horizontal_dim = `lg:left-[360px] lg:w-[calc(100vw-360px)]`
                lg_content_area_horizontal_tools_dim = `sm:left-[60px] sm:w-[calc(100vw-80px)] lg:left-[380px] lg:w-[calc(100vw-400px)]`
            }
        }
        else
        {
            main_side_panel_visibility = "hidden"
            lg_content_area_horizontal_dim = ""
        }

        //console.log('main_side_panel_visibility', main_side_panel_visibility)
    }

    let tools_visibility = "hidden"
    let tools_visible = false
    let bottom_bar_visibility = "hidden"
    let bottom_bar_visible = false
    let lg_main_sidebar_height = ""
    //let fab_base_visibility = "hidden"
    //let fab_visibility = fab_base_visibility;
    //let fab_bottom = "bottom-0"
    let vertical_toolbar_visibility = "hidden sm:block"
    let content_left = "left-0 sm:left-[40px]";
    let content_width = "w-screen  sm:w-[calc(100vw-40px)] ";
    let horizontal_nav_tabs_visibility = "hidden"

    let content_top = ""
    let content_height = ""

    const FAB_HIDDEN = 0
    const FAB_VISIBLE_ON_MOBILE = 1
    const FAB_VISIBLE_ALWAYS = 2
    let fab_visibility_mode = FAB_HIDDEN
    let is_fab_visible = false;


    $: { tools_visible = $tools_visible_store
        bottom_bar_visible = $bottom_bar_visible_store
        let dts = $data_tick_store;

        //if(!hasSelectedItem())
        //    bottom_bar_visible = false;

        if(tools_visible)
        {

            const alwaysShowFAB = (!is_small) && $showFABAlways

            if(alwaysShowFAB)
            {
                fab_visibility_mode = FAB_VISIBLE_ALWAYS
                tools_visibility = "hidden"
                content_top = 'top-[0px]' //25:'top-[50px] sm:top-[0px]'

                if(bottom_bar_visible)
                    content_height = `min-h-[calc(100vh-290px)] sm:h-[calc(100vh-240px)]`
                else
                    content_height = `min-h-[calc(100vh-50px)] sm:h-[calc(100vh-0px)]`
            }
            else
            {
                fab_visibility_mode = FAB_VISIBLE_ON_MOBILE
                tools_visibility = "hidden sm:block sm:fixed"
                content_top = 'top-[0px] sm:top-[40px]'

                if(bottom_bar_visible)
                    content_height = `min-h-[calc(100vh-290px)] sm:h-[calc(100vh-280px)]`
                else
                    content_height = `min-h-[calc(100vh-50px)] sm:h-[calc(100vh-40px)]`
            }
        }
        else
        {
            tools_visibility = "hidden"
            //fab_base_visibility = "hidden"
            fab_visibility_mode = FAB_HIDDEN

            content_top = `top-[50px] sm:top-0`
            if(bottom_bar_visible)
                content_height = `min-h-[calc(100vh-290px)] sm:h-[calc(100vh-240px)]`
            else
                content_height = `min-h-[calc(100vh-50px)] sm:h-screen`
        }



        if(bottom_bar_visible)
        {
            lg_main_sidebar_height = `lg:h-[calc(100vh-240px)]`
            bottom_bar_visibility = "fixed"
         //   fab_bottom = `bottom-[240px]`;
        }
        else
        {
            lg_main_sidebar_height = ""
            bottom_bar_visibility = "hidden"
         //   fab_bottom = "bottom-0"
        }


        //fab_visibility = fab_base_visibility;
        determineFABVisibility();
    }


    $: navigationPageSetup($location);
    function navigationPageSetup(...args)
    {
        const navMode = navGetMode()
        if(navMode == NAV_MODE_SIDEBAR)
        {
            vertical_toolbar_visibility = "hidden sm:block"
            content_left = "left-0 sm:left-[40px]";
            content_width = "w-screen  sm:w-[calc(100vw-40px)]";

            horizontal_nav_tabs_visibility = "hidden"
            return false;
        }
        else
        {
            if(navIsVisible())
                horizontal_nav_tabs_visibility = "block"
            else
                horizontal_nav_tabs_visibility = "hidden"

            //if(navIsVisible())
            //{
            //    vertical_toolbar_visibility = "block"
            //    content_left = "left-[50px]";
            //    content_width = "w-[calc(100vw-50px)] ";
            //    return true;
            //}
            //else
            {
                vertical_toolbar_visibility = "hidden sm:block"
                content_left = "left-0 sm:left-[40px]";
                content_width = "w-screen  sm:w-[calc(100vw-40px)] ";
                return false;
            }
        }
    }

    //$: screen.width = innerWidth;

    $: switchBodyClass($dark_mode_store);
    function switchBodyClass(...args)
    {
        document.body.className = $dark_mode_store;
    }

    onMount( () => {


        window.addEventListener('resize', on_resize)

        const vp = window.visualViewport;
        vp?.addEventListener('resize', onViewportResize)
        setViewportHeight(vp)

        document.addEventListener('selectionchange', onSelectionChanged)
        //document.addEventListener('focusout', onFocusOut)

        document.addEventListener("visibilitychange",onVisibilityChanged);

        return () => {

          //  document.removeEventListener('focusout', onFocusOut)
            document.removeEventListener('selectionchange', onSelectionChanged)
            document.removeEventListener("visibilitychange",onVisibilityChanged);
            vp?.removeEventListener('resize', onViewportResize)
            window.removeEventListener('resize', on_resize)

            // remove dark class form body element when we leave Layout view
            if($dark_mode_store)
                document.body.classList.remove($dark_mode_store)
        }
    })

    function on_resize()
    {
        navAutoHide()
    }

    let minViewportHeight = 0;
    let maxViewportHeight = 0;
    function setViewportHeight(vp)
    {
        if(!vp)
            return;

        const h = vp.height
        if(!minViewportHeight) {
            minViewportHeight = h }
        else if(minViewportHeight > h) {
            minViewportHeight = h }

        if(!maxViewportHeight) {
            maxViewportHeight = h; }
        else if(maxViewportHeight < h) {
            maxViewportHeight = h }
    }

    function onViewportResize(e)
    {
        console.log('onViewportResize')
        const vp = window.visualViewport;
        setViewportHeight(vp)

        determineFABVisibilityAsync();
    }

    function onVisibilityChanged()
    {
        console.log('#jcache onVisibilityChanged')
        pushChanges();
    }

    function onSelectionChanged(e)
    {
        //console.log('onSelectionChanged')
        determineFABVisibilityAsync();
    }

    function onFocusOut(e)
    {
        determineFABVisibilityAsync();
    }

    let change_ticket = 0
    let last_change_ticket = 0
    function determineFABVisibilityAsync()
    {
        change_ticket++;
        setTimeout( () => {
            if(change_ticket != last_change_ticket)
            {
                last_change_ticket = change_ticket;
                determineFABVisibility();
            }
        }, 200)

    }

    function determineFABVisibility()
    {
        switch(fab_visibility_mode)
        {
        case FAB_HIDDEN:
            is_fab_visible = false;
            break;

        case FAB_VISIBLE_ON_MOBILE:
            if(isDeviceSmallerThan("sm"))
            {
                if(isOnScreenKeyboardVisible())
                    is_fab_visible = false;
                else
                    is_fab_visible = true;
            }
            else
                is_fab_visible = false;
            break;

        case FAB_VISIBLE_ALWAYS:
            if(isOnScreenKeyboardVisible())
                is_fab_visible = false;
            else
                is_fab_visible = true;
            break;
        }
    }

    let operationsComponent
    let fabComponent;
    afterUpdate( () =>
    {
        UI.operations = operationsComponent
        UI.fab = fabComponent;
    })

</script>

<svelte:window bind:innerWidth bind:outerWidth bind:innerHeight bind:outerHeight />


<!--AuthorizedView {autoRedirectToSignIn}-->

    {#key $wholeAppReloader}

        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div    id="__hd_svelte_layout_root" class="{$dark_mode_store} thin-scrollbar"
                on:click={handleSelect}
                on:contextmenu={handleSelect}>

            <div class="desk-root bg-stone-200 dark:bg-stone-950  dark:text-white  overflow-x-clip
                        sm:overflow-y-clip  min-h-screen sm:h-screen">
                <!--###########################################################-->
                <!--##  HORIZONTAL TOP TITLE TOOLBAR (FOR PHONES)  ############-->
                <!--###########################################################-->
                <!--header class="fixed sm:hidden w-screen top-0 h-[50px] sm:h-[40px]
                                z-20 shadow  shadow-stone-900/5 dark:shadow-none
                                overflow-auto" >
                        <div class=" flex flex-row justify-between  h-full  bg-stone-950   text-stone-100 ">
                            <HorizontalToolbar appConfig={layout}/>
                        <div>
                </header-->


                <!--#######################################################-->
                <!--##  VERTICAL TOOLBAR                 ##################-->
                <!--#######################################################-->
                <div  class="hidden sm:block fixed left-0 top-[50px] sm:top-0 w-[40px] h-screen z-20 inset-0   overflow-hidden">
                    <div class="sticky top-0 flex h-full w-12 sm:w-10 bg-stone-800 dark:bg-stone-950 flex-col items-center text-stone-100 shadow">
                        <VerticalToolbar appConfig={layout} mobile={false}/>
                    </div>
                </div>

                <header class="block sm:hidden  fixed w-screen bottom-0 h-[50px] sm:h-[40px] z-20 shadow  shadow-stone-900/5 dark:shadow-none     overflow-auto" >
                    <div class="    flex flex-row justify-between  h-full
                                    text-stone-500 bg-stone-200/70 hover:bg-stone-200
                                    dark:text-orange-200 dark:bg-stone-700/70 dark:hover:bg-stone-700
                                    bg-stone-200 dark:bg-stone-800/70
                                    border-t border-stone-500 ">
                        <HorizontalNavigatorTabs appConfig={layout}/>
                    <div>
                </header>


                <!--#######################################################-->
                <!--##  MAIN SIDE BAR                    ##################-->
                <!--#######################################################-->
                {#if true}
                {@const sidebar_left = $sidebar_left_pos==0 ? "left-0" : "left-[50px]"}
                {@const sidebar_small_width = $sidebar_left_pos==0 ? "w-full" : "w-[calc(100vw-50px)]"}

                <div  class="main-side-bar {main_side_panel_visibility}
                                left-0 top-0 sm:left-[40px]
                                top-0
                                w-full sm:w-[320px]
                                h-[calc(100vh-50px)] sm:h-full {lg_main_sidebar_height}

                                z-20 overflow-x-hidden

                                bg-stone-50 dark:bg-stone-900
                                border-r-1 border-stone-500/30 dark:border-stone-300
                                sm:shadow sm:shadow-stone-700/40
                                sm:dark:shadow-stone-900/90">

                    <div class="    w-full h-full  overflow-y-auto overscroll-contain py-0 px-0">

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
                <section class = "" on:click|capture={() => navAutoHide()  } >

                    <!--###########################################################-->
                    <!--##  HORIZONTAL TOOLS                 ######################-->
                    <!--###########################################################-->

                    <div  class="horizontal-tools {tools_visibility}
                                    mt-2 p-1
                                    w-full
                                    h-[40px]
                                    left-0 sm:left-[40px]
                                    sm:top-0
                                    {lg_content_area_horizontal_tools_dim}
                                    z-10 overflow-hidden
                                     rounded-2xl
                                    bg-stone-50 dark:bg-stone-800
                                    border-b-1 border-stone-500/30 dark:border-stone-100
                                    sm:shadow sm:shadow-slate-700/40
                                    sm:dark:shadow-black" >
                        <Operations bind:this={operationsComponent} />

                    </div>



                    <!--#######################################################-->
                    <!--##  CONTENT                          ##################-->
                    <!--#######################################################-->
                    <!-- fixed => relative, content-height => min content height -- -->
                    <div    id="__hd_svelte_main_content_container"
                            class="relative
                                    {content_left}
                                    {content_width}
                                    {content_top}
                                    {lg_content_area_horizontal_dim}
                                    z-0 overflow-x-hidden
                                    {content_height} sm:overflow-y-auto sm:overscroll-contain
                                    "
                                    >
                            <Configurable config={layout.mainContent} min_h_class="min-h-screen">
                                <div slot='alt'></div>
                            </Configurable>
                    </div>

                     {#if is_fab_visible}
                    <!--div class="{fab_visibility} left-3 {fab_bottom} mb-1 cursor-pointer z-10"-->
                        <Fab bind:this={fabComponent} />
                    <!---/div-->
                    {/if}

                    <!--###########################################################-->
                    <!--##  BOTTOM SIDEBAR          ###############################-->
                    <!--###########################################################-->

                    <div  class="{bottom_bar_visibility} left-0 bottom-0 w-screen h-[240px] z-20 overflow-y-hidden overflow-x-auto
                                sm:left-[40px] sm:w-[100vw-40px] " >
                            <Configurable config={layout.selectionDetails} >
                                <div slot="alt"></div>
                            </Configurable>

                    </div>

                    <!--##########################################################-->
                    <!--##  ALERTS ###############################################-->
                    <!--##########################################################-->
                    <section class="fixed left-2 sm:left-auto sm:right-2 bottom-2 flex flex-col gap-2">
                        {#if $alerts && $alerts.length > 0}
                            {#each $alerts as alert, idx}
                                <Alert class="bg-red-900/40  shadow-lg shadow-stone-400 dark:shadow-black flex flex-row-reverse sm:flex-row">
                                    {@const text_max_width = is_small ? '60vw' : '75vw'}

                                    <p class="flex-none truncate" style="max-width: {text_max_width}">
                                        {alert.msg}
                                    </p>
                                    <button class="block sm:ml-auto w-3 mx-1"
                                            on:click={() => {navigator.clipboard.writeText(alert.msg)}}>
                                        <FaCopy/>
                                    </button>
                                    <button class="block w-3 mx-1"
                                            on:click={() => {removeAlert(alert)}}>
                                        <FaTimes/>
                                    </button>
                                </Alert>
                            {/each}
                        {/if}
                    </section>

                    <!-- #########################################################-->
                    <!-- ## MODAL DIALOG #########################################-->
                    <!-- #########################################################-->
                    <div id="__hd_svelte_modal_root" class="z-30 sm:z-40">
                        <!-- after <Modal/> component is shown it's rettached to above div
                            see: modal.svelte afterUpdate -->
                    </div>

                </section>

            </div>
        </div>
    {/key}
<!--/AuthorizedView-->

<style lang="scss">


    /* bg-white */
    :global(body)
    {
      --tw-bg-opacity: 1;
      background-color: rgb(255 255 255 / var(--tw-bg-opacity));
    }


    :global(body.dark)
    {
      --tw-bg-opacity: 1;
      background-color: rgb(12 10 9 / var(--tw-bg-opacity));

    }

</style>