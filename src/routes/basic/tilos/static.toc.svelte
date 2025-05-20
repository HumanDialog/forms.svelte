<script lang="ts">
    import {popup_visible_store, tools_right_store, hide_popup} from './static.doc.utils'
   // import {tools_right_store, popup_visible_store, hide_popup} from "./../doc.elements/doc.js";
    import { location, push, link } from 'svelte-spa-router';
    
    export let toc = [];
    export let links = [];
    export let book_index = "";
    export let book_title = "";
    export let scope :string = 'doc';
  
    let main_side_panel_class = ""
    let visible_popup_index = ''
    let side_panel_right = false;
    if(screen.width < 1024)
        main_side_panel_class = "hidden"
        
    $: { 
        side_panel_right = $tools_right_store
        visible_popup_index = $popup_visible_store
        
        console.log(screen.width)
        console.log("$toc:" + visible_popup_index)
        let width = window.innerWidth
        if(width < 1024 && visible_popup_index != "TOC")
        {
            main_side_panel_class = "hidden"
        }
        else 
        {   
        if(side_panel_right)
        {
            main_side_panel_class = "sm:left-[calc(100vw-40px-256px)] order-12 bg-stone-50";
        }
        else
        {
            main_side_panel_class = "left-0 sm:left-10 "
        }
        }
    }

    let current_location :string;
    $:{
        current_location = $location;
    }

    function is_active(href :string, location :string, chapter_idx :number, page_idx :number) :boolean
    {
        let segments = location.split('/');
        if((segments.length < 4) || (!segments[3]))
        {
            if((chapter_idx == 0) && (page_idx == 0))
                return true;
            else
                return false;
        }

        let h=href;
        if(h.startsWith('#'))
            h = h.substr(1);
        
        if(h == location)
            return true;
        else
            return false;
    }

    function get_active_class(is_active: boolean) :string
    {
        if(is_active)
            return "bg-stone-200 dark:bg-stone-700 rounded-lg font-medium ml-1.5 pl-2";
        else
            return "";
    }

    function navigate_up()
    {
        let segments = $location.split('/');
        let component = segments.length > 1 ? segments[1] : null;
        let document = segments.length > 2 ? segments[2] : null;
        
        if((!document) || (document=='toc'))
            push('/');
        else
            push('/'+component)
    }

    
</script>

<div  class="bg-stone-50 dark:bg-stone-800 w-screen sm:w-[320px] top-10 sm:top-0 {main_side_panel_class} 
                lg:block fixed z-20 inset-0 lg:left-[max(40px,calc(50vw-720px))]  right-auto pb-10 px-0"
   >

    <div
        class=" sticky  h-[calc(100vh-40px)] sm:h-screen overflow-y-auto overflow-x-hidden py-4 px-4">
        <!--button class="w-4 h-4 text-stone-600  dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100"
                on:click={navigate_up}><FaArrowLeft/></button-->
        <p class = "inline-block text-xl sm:text-2xl font-extrabold text-stone-900 tracking-tight dark:text-stone-200 mb-4">{book_title}</p>
        <nav class="text-sm">
            <ul class="space-y-9">
                {#if toc != null}
                {#each toc as chapter, chapter_idx}
                <li>
                    <h2 class="font-display font-medium text-stone-900 dark:text-white">{chapter.Chapter}</h2>
                    <ul
                        class="flex flex-col items-start mt-2 space-y-2 border-l-2 border-stone-100 dark:border-stone-700  lg:border-stone-200">
                    {#each chapter.Pages as page, page_idx}
                        {@const href=`/${scope}/${book_index}/${page.Id}`}
                        {@const active=is_active(href, current_location, chapter_idx, page_idx)}
                        {@const active_class=get_active_class(active)}
                        <!--button class="relative" on:click={()=> (hide_popup())}-->
                            <a  class="block w-full pl-3.5 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 {active_class}"
                                use:link        
                                on:click={()=> (hide_popup())}
                                href={href}>
                                    {page.Page}
                                </a>
                        <!--/button-->
                    {/each}
                </li>    
                {/each}
                {:else}
                <li>
                    <h2 class="font-display font-medium text-stone-900 dark:text-white">How to use manual site</h2>
                    <ul role="list"
                        class="mt-2 space-y-2 border-l-2 border-stone-100 dark:border-stone-800  lg:border-stone-200">
                        <li class="relative"><a
                                class="block  w-full pl-3.5 text-stone-500  hover:text-stone-900"
                                href="/">Getting started</a></li>
                        <li class="relative"><a
                                class="block w-full pl-3.5 before:pointer-events-none before:absolute before:-left-0.5 before:top-1/2 before:h-4 before:w-0.5 before:-transtone-y-1/2 before:rounded-none font-semibold text-sky-500 before:bg-sky-500"
                                href="/docs/installation">Installation</a></li>
                    </ul>
                </li>                
                {/if}
                
                
                
                {#if links != null}
                {#each links as group}
                <li>
                    <h2 class="font-display font-medium text-stone-900 dark:text-white">{group.Label}</h2>
                    <ul
                        class="mt-2 space-y-2 border-l-2 border-stone-100 dark:border-stone-800  lg:border-stone-200">
                    {#each group.Links as link}
                    <li class="relative"><a
                        class="block  w-full pl-3.5 text-stone-500  hover:text-stone-900"
                        href={link.href}>{link.Label}</a></li>
                    {/each}
                </li>    
                {/each}
                {/if}
      </ul>
        </nav>
    </div>
</div>