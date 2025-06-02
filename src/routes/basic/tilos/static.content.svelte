<script lang="ts">
    import {
        book_store
    } from "./static.doc.utils.js";
    //import {
    //    tools_right_store
    //} from "./../doc.elements/doc.js";
    
    //import Highlight from "svelte-highlight";
    //import javascript from "svelte-highlight/languages/javascript";
    //import ocl from './ocl.js'
    //import http from "svelte-highlight/languages/http";
    //import json from "svelte-highlight/languages/json";
    //import xml from "svelte-highlight/languages/xml";
    //import typescript from "svelte-highlight/languages/typescript"
    //import github from "svelte-highlight/styles/github";
    //import black_metal from "svelte-highlight/styles/black-metal-bathory"
    //import darkTheme from "svelte-highlight/styles/espresso";
    //import lightTheme from "svelte-highlight/styles/classic-light";
    import { dark_mode_store } from "$lib";
    import {
        location,
        link,
        querystring
    } from 'svelte-spa-router';
    //import CheatSheet from '../doc.elements/cheat.sheet.svelte'
    //import Feedback from "./feedback.survey.svelte";
    import {
        afterUpdate
    } from "svelte";
    /*
    let lang = {
        "http": http,
        "json": json,
        "xml": xml,
        "js": javascript,
        "ts": typescript,
        "html": xml
    }
    */
    //1024! - look for that
    export let page_index: string | undefined = undefined;
    export let scope: string = 'doc';
    let book = null;
    let book_content = [];
    let book_index = '';
    let book_title = '';
    let title = ""
    let page_content = [];
    let page_subjects = [];
    let page_subjects_no = 0;
    book_store.subscribe((value) => {
        book = value;
        if (book != null && book.Index != book_index) {
            //console.log("subscription:");
            //console.log(book);
            book_index = book.Index
            title = book.Title
            book_content = book.Content;
            //console.log(book_content);
            //page_content = book_content["0"].Article
            //page_subjects = book_content["0"].Subjects
            //console.log("/subscription");
            //console.log(page_content);
        } else if (book == null) {
            title = "Unknown book";
        }
    });
    let page = null
    let prev_page = ""
    let next_page = ""
    let prev_page_id = ""
    let next_page_id = ""
    let right_xl_padding = ""
    let page_title = "";
    let top_heading_title = "";
    //$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
    //$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$  
    let box;
    let scroll_to = '';
    $: {
        if (book != null) {
            page = book_content[page_index]
            if (!page) {
                page_index = book.FirstPage;
                page = book_content[page_index]
            }
            if (page_index == book.FirstPage)
                book_title = book.Title;
            else
                book_title = '';
            let titles = get_page_title(page_index, book);
            page_title = titles.whole_title;
            top_heading_title = titles.short_title;
            if (page != null) {
                page_content = page.Page;
                page_subjects_no = page.SubjectsNo
                if (page.SubjectsNo > 0) {
                    page_subjects = book.TOC[page.ChapterNo].Pages[page.PageNo].Subjects
                    //console.log(page_subjects)
                    right_xl_padding = "xl:pr-[256px]"
                } else {
                    right_xl_padding = "xl:pr-[128px]"
                }
                prev_page = page.PrevPage
                next_page = page.NextPage
                prev_page_id = page.PrevPageId
                next_page_id = page.NextPageId
                title = find_page_chapter_name(page_index, book);
                //console.log(page_content);

                const params = new URLSearchParams($querystring);
                if(params.has("s"))
                    scroll_to = params.get("s")
                else
                    scroll_to = '#top';
                
            }
        }
    }
     afterUpdate( () => {
        
        if(scroll_to)
        { 
            
            if(scroll_to.startsWith('#'))
                scroll_to = scroll_to.substr(1);
            
            let top_element = document.getElementById(scroll_to)
            if(top_element)
                top_element.scrollIntoView();
            scroll_to = '';
        }
    })

    function find_page_chapter_name(page_index: string, book: object): string {
        let toc = book['TOC'];
        if (!toc)
            return "";
        for (let cno = 0; cno < toc.length; cno++) {
            const chapter = toc[cno];
            if (chapter.Pages.find(page => page.Id == page_index))
                return chapter.Chapter;
        }
        return "";
    }

    function get_page_title(page_index: string, book: object, show_whole_path: boolean = true) {
        let toc = book['TOC'];
        if (!toc)
            return {
                whole_title: book.Title,
                short_title: book.Title
            };
        for (let cno = 0; cno < toc.length; cno++) {
            const chapter = toc[cno];
            const page = chapter.Pages.find(page => page.Id == page_index);
            if (page) {
                return {
                    whole_title: `${book.Title} > ${chapter.Chapter} > ${page.Page}`,
                    short_title: page.Page
                }
            }
        }
        return {
            whole_title: book.Title,
            short_title: book.Title
        };
    }
    //$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
    //$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$    
    let content_comment_class = ""
    let content_class = "" //"max-w-2xl" //Tu jest problem z toolbarem
    let side_panel_right = false;
    $: {
        side_panel_right = false //$tools_right_store
        if (side_panel_right) {
            content_comment_class = "order-first"
        } else {
            content_comment_class = ""
        }
    }
</script>

<svelte:head>
    <!--
    {#if $dark_mode_store == 'dark'}
        {@html darkTheme}
    {:else}
        {@html lightTheme}
    {/if}
    -->

    <title>{page_title} | __APP_TITLE__</title>

    {#if book?.Tags?.description}
        <meta name="description" content="{book?.Tags?.description}"/>
        <meta property="og:description" content={book?.Tags?.description} />
        <meta name="twitter:description" content={book?.Tags?.description} />
    {/if}

    <meta property="og:type" content="website" />
	<meta property="og:title" content="{page_title}" />
	<meta property="og:site_name" content="{__APP_TITLE__}" />
	
	<!--meta property="og:image" name="og:image" content={image} /-->
	<meta name="og:url" content="{__WEBSITE__}/{scope}/{book_index}/{page_index}" />

	<meta name="twitter:site" content="@ObjectReef" />
	<!--meta name="twitter:image" content={image} /-->
	<meta name="twitter:card" content="summary" />
	<meta name="twitter:title" content="{page_title}" />

    <link rel="canonical" href="{__WEBSITE__}/{scope}/{book_index}/{page_index}"/>
</svelte:head>

<div class="antialiased overflow-hidden sm:overflow-auto  bg-white dark:bg-stone-900">
    <div>
        <div id="1440" class="max-w-[1280px] mx-auto px-0 sm:px-0 md:px-0">
            <div class=" sm:pl-10  lg:pl-[360px] {right_xl_padding}">

                <!--div class="min-w-0 {content_class} flex-auto px-4 py-16  lg:px-8 overflow-y-auto overflow-x-hidden"-->
                <div class=" margin-x-auto h-[calc(100vh-50px)] sm:h-auto px-4 sm:px-8 lg:px-10 
                             overflow-y-scroll sm:overflow-y-visible overflow-x-hidden " bind:this={box}>
                    <article>
                        <header id="top" class="mb-9 space-y-1">
                            {#if book_title}
                                <h1 class="font-display text-5xl tracking-tight text-stone-900 dark:text-white pt-10 mb-20">{book_title}</h1>
                            {/if}
                            <h1 class="font-display text-3xl tracking-tight text-stone-900 dark:text-white pt-10">{title}</h1>
                        </header>
                        <!--div class="prose prose-stone max-w-none dark:prose-invert dark:text-stone-400 prose-headings:scroll-mt-28 prose-headings:font-display prose-headings:font-normal lg:prose-headings:scroll-mt-[8.5rem] prose-lead:text-stone-500 dark:prose-lead:text-stone-400 prose-a:font-semibold dark:prose-a:text-sky-400 prose-a:no-underline prose-a:shadow-[inset_0_-2px_0_0_var(--tw-prose-background,#fff),inset_0_calc(-1*(var(--tw-prose-underline-size,4px)+2px))_0_0_var(--tw-prose-underline,theme(colors.sky.300))] hover:prose-a:[--tw-prose-underline-size:6px] dark:[--tw-prose-background:theme(colors.stone.900)] dark:prose-a:shadow-[inset_0_calc(-1*var(--tw-prose-underline-size,2px))_0_0_var(--tw-prose-underline,theme(colors.sky.800))] dark:hover:prose-a:[--tw-prose-underline-size:6px] prose-pre:rounded-xl prose-pre:bg-stone-900 prose-pre:shadow-lg dark:prose-pre:bg-stone-800/60 dark:prose-pre:shadow-none dark:prose-pre:ring-1 dark:prose-pre:ring-stone-300/10 dark:prose-hr:border-stone-800"-->
                        <div class="prose prose-stone max-w-none dark:prose-invert dark:text-stone-200">

                            {#if page_content != null}
            {#each page_content as fragment}
                {#if fragment.Kind == "HTML"}
                    {@html fragment.HTML}
                {:else if fragment.Kind == "CODE"}
                    {#if fragment.Type == null}
                        <div class="overflow-x-auto shrink">
                            <div>
                        <!--Highlight language={ocl} code={fragment.Src} class="p-0"/-->    
                            </div>
                        </div>
                    {:else}    
                    <div class="overflow-x-auto">
                        <!--Highlight language={lang[fragment.Type]} code={fragment.Src} class="p-0"/-->    
                    </div>
                    {/if}
                {:else if fragment.Kind == "IMG"}
                    
                    <figure>
                        <!--img src="https://images.unsplash.com/photo-1556740758-90de374c12ad?ixlib=rb-1.2.1&amp;ixid=eyJhcHBfaWQiOjEyMDd9&amp;auto=format&amp;fit=crop&amp;w=1000&amp;q=80"
                            alt="" /-->
                        <img src={`/${scope}/${book_index}/${fragment.PATH}`}
                            alt="" />
                            {#if fragment.Caption != null && fragment.Caption != ""}
                            <figcaption>
                                {@html fragment.Caption}
                             </figcaption>
                             {/if}
                    </figure>
                {:else if fragment.Kind == "CHEATSHEET"}
                    <div class="not-prose max-w-none">
                        <!--CheatSheet/-->                    
                    </div>
                {:else}
                    <p>Unknown content kind: {fragment.Kind}</p>
                {/if}
            {/each}
            
            {:else}
            <p>Page is empty</p>
            {/if} 
            
        </div>
    </article>


    
    <dl class="mt-12 mb-12 flex border-t border-stone-200 pt-6 dark:border-stone-800">
        <div>
            {#if prev_page != ""}
            <dt class="font-display text-sm font-medium text-stone-900 dark:text-white">Previous</dt>
            <dd class="mt-1"><a
                    class="text-base font-semibold text-stone-500 hover:text-stone-600 dark:text-stone-400 dark:hover:text-stone-300"
                    use:link
                    href={`/${scope}/${book_index}/${prev_page_id}`}>
                    <span aria-hidden="true">←</span> {prev_page}</a></dd>
            {/if}
        </div>
        <div class="ml-auto text-right">
            {#if next_page != ""}
            <dt class="font-display text-sm font-medium text-stone-900 dark:text-white">Next</dt>
            <dd class="mt-1"><a
                    class="text-base font-semibold text-stone-500 hover:text-stone-600 dark:text-stone-400 dark:hover:text-stone-300"
                    use:link
                    href={`/${scope}/${book_index}/${next_page_id}`}>{next_page}
                    <span aria-hidden="true">→</span></a></dd>
            {/if}        
        </div>
    </dl>

     <!-- ############################## Feedback survey ################################################### -->
    
     <!--Feedback class="mt-20"/-->

     <!-- ######################################################################################################## --> 

</div>   
   
</div>
<!--#######################################################-->
<!--##  CONTENT COMMENTS                 ##################-->
<!--#######################################################-->
{#if page_subjects_no > 0}
<div class="    hidden xl:block fixed  w-[256px] right-[max(0px,calc(50vw-720px))]
                z-20 top-[2px] bottom-0  py-10 overflow-y-auto bg-stone-50 dark:bg-stone-800">
    <div class="px-8">
        
        
        <h2 id="on-this-page-title" class="font-display text-sm font-medium text-stone-900 dark:text-white">
            On this page</h2>
        <ol class="mt-4 space-y-3 text-sm">
            {#if !!top_heading_title}
                <li>
                    <h3>
                        <a class="font-normal text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-300 cursor-pointer"
                            href={`/${scope}/${book_index}/${page_index}?s=${page_index}`} use:link>{top_heading_title}</a>
                    </h3>
                </li>
            {/if}
            {#each page_subjects as subject}
            <li>
                <h3><a class="font-normal text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-300 cursor-pointer"
                        href={`/${scope}/${book_index}/${page_index}?s=${subject.Id}`} use:link
                        >{subject.Subject}</a></h3>
                 
                </li>        
            {/each}
 
         </ol>
     
    </div>
</div>
{/if} 


</div>
</div>
</div>