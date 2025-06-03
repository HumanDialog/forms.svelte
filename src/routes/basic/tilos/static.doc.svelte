<script>
    import { book_store, fetch_book, screen, toggle_popup } from './static.doc.utils.js'
    import { location, push } from 'svelte-spa-router';
    import {VerticalToolbar, isDeviceSmallerThan, dark_mode_store, HorizontalToolbar} from '$lib'
    import {FaBars} from 'svelte-icons/fa'
    
    import TOC from "./static.toc.svelte";
    import Content from "./static.content.svelte";
    import {onMount} from 'svelte'
    import TilosIco from '../icons/tilos.icon.svelte'

    export let scope = 'doc';
    export let catalog_href = '/doc/toc';

    //==========================================
    let urlpath = $location;
    let path_array = [];//urlpath.split("/");
    let path_size = 0;//path_array.length
    let book = null;
    let toc = [];
    let links = [];
    let book_content = [];
    let page = null;

    let book_index = ''
    let book_title = ''
    let page_index = '0'
    let subject = ''
    
    $: mobile = isDeviceSmallerThan("sm")
    
    //$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
    //$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
    $: {urlpath = $location;
        
        path_array = urlpath.split("/");
        path_size = path_array.length
        if(path_size > 2) 
            book_index = path_array[2];
        else
            book_index = "toc";

        if(path_size > 3) 
            page_index = path_array[3];
        else
            page_index = "";    

        if(path_size > 4) 
            subject = path_array[4];
            
        if(book == null || book.Index != book_index)
            get_book();
    }

    
    //$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
    //$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$

    
    async function get_book()
    {
        if(book_index == '')
            book_index = 'toc'; 

        let my_book;
        if((book == null) || (book.Index != book_index))
        {
            my_book = await fetch_book(book_index, scope);
            if(my_book == null)
            {
                book_index = 'toc';
                my_book = await fetch_book(book_index, scope);
            }
        }
        
        book = my_book;
        book.Index = book_index;
        //console.log(book);
        toc = book.TOC;
        links = book.Links;
        book_content = book.Content;
        book_title = book.Title
        $book_store = book;
        
        //if(book == null)
        //    fetch_book('doc')
    }

/// ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    


    
    
    let main_side_panel_class = ""
    let vertical_toolbar_class = ""
    let content_comment_class = ""
    let content_class = ""//"max-w-2xl" //Tu jest problem z toolbarem
    let side_panel_right = true;
    if(side_panel_right)
    {
        main_side_panel_class = "sm:left-[calc(100vw-40px-256px)] order-12 bg-stone-50";
        content_comment_class = "order-first"
        vertical_toolbar_class = "order-last"
    }
    else
    {
        main_side_panel_class = "sm:left-10 bg-stone-50"
        vertical_toolbar_class = "order-first"
        content_comment_class = ""
    }
    
    $: outerWidth = 0;
    $: innerWidth = 0;
    $: outerHeight = 0;
    $: innerHeight = 0;
    const media_break_sm = 640; //px	@media (min-width: 640px) { ... }
    const media_break_md = 768; //px	@media (min-width: 768px) { ... }
    const media_break_lg = 1024; //px	@media (min-width: 1024px) { ... }
    const media_break_xl = 1280; //px	@media (min-width: 1280px) { ... }
    const media_break_2xl = 1536; //px
    
    $: screen.width = innerWidth;  

    const mainToolbarConfig = {
        darkMode: true,
        signin: true
    }

    const definedTabs = [
        {
            icon: FaBars,
            key: '',
            onclick: (e) => { toggle_popup('TOC') }
        },
        {
            icon: TilosIco,
            key: '',
            onclick: (e) => { push('/thome') }
        }
    ]

    const vertical_toolbar_visibility = "hidden sm:block"

    $: switchBodyClass($dark_mode_store);
    function switchBodyClass(...args)
    {
        document.body.className = $dark_mode_store;
    }

    onMount( () => {
        
        return () => {        
            if($dark_mode_store)
                document.body.classList.remove($dark_mode_store)
        }
    })

</script>

<svelte:window bind:innerWidth bind:outerWidth bind:innerHeight bind:outerHeight />

<div class="{$dark_mode_store}">
<!--###########################################################-->
<!--##  HORIZONTAL TOOLBAR (FOR PHONES)  ######################-->
<!--###########################################################-->
    <!--HorizontalToolbar {catalog_href}/ -->
    <header class="sm:hidden w-screen top-0 h-[50px] sm:h-[50px] z-20 shadow  shadow-stone-900/5 dark:shadow-none     overflow-auto" >
        <div class=" flex flex-row justify-between  h-full  bg-stone-950   text-stone-100 ">
            <HorizontalToolbar {definedTabs} {mainToolbarConfig} />
        </div>
    </header>

    <!--#######################################################-->
    <!--##  VERTICAL TOOLBAR                 ##################-->
    <!--#######################################################-->
    <!--VerticalToolbar {catalog_href}/-->
    <div  class="{vertical_toolbar_visibility} fixed left-0 top-[50px] sm:top-0 w-[50px] sm:w-[40px] h-screen z-20 inset-0   overflow-hidden">
        <div class="sticky top-0 flex h-full w-12 sm:w-10 bg-stone-800 dark:bg-stone-950 flex-col items-center text-stone-100 shadow">
            <VerticalToolbar {definedTabs} {mainToolbarConfig} {mobile} />
        </div>
    </div>

    <!--#######################################################-->
    <!--##  MAIN SIDE PANEL                  ##################-->
    <!--#######################################################-->
    <TOC {toc} {book_title} {book_index} {links} {scope}/>
    <!--###########################################################-->
    <!--##  VERTICAL TOOLS AND CONTENT       ######################-->
    <!--###########################################################-->


    <!--#######################################################-->
    <!--##  CONTENT                          ##################-->
    <!--#######################################################-->
    <Content {page_index} {scope}/>
</div>