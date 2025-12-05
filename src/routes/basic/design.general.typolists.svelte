<script>
    import {
        reef,
        session
    } from '@humandialog/auth.svelte'
    import {
        location,
        push,
        link
    } from 'svelte-spa-router'
    import {
        Page,
        Kanban,
        KanbanColumn,
        KanbanTitle,
        KanbanSummary,
        Spinner,
        ComboSource,
        KanbanCallbacks,
        KanbanDateProperty,
        KanbanComboProperty,
        KanbanTagsProperty,
        KanbanStaticProperty,
        mainContentPageReloader,
        KanbanSource,
        Modal,
        KanbanColumnBottom,
        onErrorShowAlert,
        Input,
        showMenu,
        Combo,
        ComboItem,
        UI,
        reloadVisibleTags,
        i18n,
        ext,
        isDeviceSmallerThan,
        Breadcrumb,
        showFloatingToolbar
    } from '$lib';
    import {
        FaPlus,
        FaList,
        FaPen,
        FaCaretLeft,
        FaCaretRight,
        FaTrash,
        FaArrowsAlt,
        FaArchive,
        FaCheck,
        FaEllipsisH,
        FaChevronRight,
        FaAngleDown,
        FaAngleUp,
        FaColumns,
        FaRandom,
        FaChevronLeft,
        FaUpload,
        FaRegCalendar,
        FaRegCalendarCheck,
        FaCaretUp,
        FaCaretDown,
        FaDownload
    } from 'svelte-icons/fa'
    import MoveOperations from './list.board.move.svelte'
    import {
        tick,
        onMount
    } from 'svelte';
    import BasketPreview from './basket.preview.svelte'
    import PopupExplorer from './popup.explorer.svelte'
    import {
        fetchComposedClipboard4TaskList,
        transformClipboardToJSONReferences,
        setBrowserRecentElement,
        getBrowserRecentElements
    } from './basket.utils'
    import {
        cache
    } from './cache.js'
    import TaskProperties from './properties.task.svelte'
    export let params = {}
    let currentList = null;
    let listId = 0;
    let listPath = '';
    let users = [];
    let taskStates = [];
    let allTags = ''
    let kanban;
    let definitionChangedTicket = 1
    let usersComboSource;
    const TLK_KANBAN_CHECKLIST = 0
    const TLK_KANBAN_PROCESS = 1
    const TLK_LIST = 2
    let otherCaption = '_; <Other>; <Otros>; <Inne>'
    let dsColumnWidth = dsCalcColumnWidth();

    function dsCalcColumnWidth_org() {
        const container = document.getElementById("__hd_svelte_main_content_container")
        const containerRect = container?.getBoundingClientRect();
        const assumed_space = containerRect.width
        const columns_no = 2;
        const column_width = Math.floor(assumed_space / columns_no);
        if (window.innerWidth >= 640)
            return `width: ${column_width}px; min-width: 200px; max-width: ${column_width}px;`
        else
            return 'width: 92%;'
    }

    function dsCalcColumnWidth() {
        const container = document.getElementById("__hd_svelte_main_content_container")
        const containerRect = container?.getBoundingClientRect();
        const assumed_space = containerRect.width
        const columns_no = 2;
        const column_width = Math.floor(assumed_space / columns_no);
        if (window.innerWidth >= 640)
            return `width: 480px; min-width: 200px; max-width: 480px;`
        else
            return 'width: 92%;'
    }
    let prose_base_class = "prose prose-base prose-zinc"
    let cl = 'w-full flex flex-col bg-white dark:bg-stone-900 overflow-x-hidden py-1 px-1 border-0'; // border-green-500
</script>

<svelte:head>
    <title>TYPOGRAPHY LISTS</title>
</svelte:head>

<div class="bg-stone-100 dark:bg-stone-800 {cl}">

    <!--------------------------------------------------------------------------------------------------------->
    <!--------------------------------------------------------------------------------------------------------->
    <!--------------------------------------------------------------------------------------------------------->
    <!--------------------------------------------------------------------------------------------------------->
    <!--------------------------------------------------------------------------------------------------------->
    <!--------------------------------------------------------------------------------------------------------->
    <!--------------------------------------------------------------------------------------------------------->
    <!--------------------------------------------------------------------------------------------------------->
    <!--------------------------------------------------------------------------------------------------------->
    <!--TABLE-------------------------------------------------------------------------------------------------->
    <div id="__hd_svelte_kanban_columns_container" class="h-full mt-5 flex flex-row no-wrap
                overflow-x-auto snap-x snap-mandatory sm:snap-none">
        <!--COLUMN------------------------------------------------------------------------------------------------->
        <div class="    snap-center
                    sm:snap-align-none
                    flex-none sm:flex-1
                    sm:min-h-[calc(100vh-8rem)]
                    min-h-[calc(100vh-5rem)]
                    rounded-md border border-transparent
                " style={dsColumnWidth}>

            <!--CONTENT------------------------------------------------------------------------------------------------->
            <!--CONTENT------------------------------------------------------------------------------------------------->
            <!--CT TENT------------------------------------------------------------------------------------------------->
            <!--C1LEFT------------------------------------------------------------------------------------------------->
            <div class="px-4">
                <h1 class="pt-0 mb-8 text-4xl font-black">Nav Lists CSS%</h1>
                <!--WRK RIGHT------------------------------------------------------------------------------------------------->
                <h2 class="text-2xl font-bold mt-12 mb-9 leading-7">Lista z ikonamy</h2>

                <!-- LIST  -->
                <div class="mt-8 mb-8">
                    <!-- ROW -->
                    <figure class="mt-7 mb-8 pl-1 flex flex-row w-full text-stone-900 dark:text-stone-300">
                        <!-- ICON -->
                        <span >
                            <div class="mt-1 h-4 w-4 text-stone-700 dark:text-stone-400 cursor-pointer ml-0  mr-0">
                                <FaList />
                            </div>
                        </span>
                        <!-- TEXT BLOCK -->
                        <div class="ml-3 w-full">
                            <h4 class="text-base font-bold whitespace-nowrap overflow-clip w-full ">
                                I often do this thing where list items have headings.
                            </h4>
                            <p class="mt-3 text-sm font-thin tracking-wide text-stone-600 dark:text-stone-200">
                                By default, Tailwind removes all of the default browser
                                styling from paragraphs, headings, lists and more. This ends
                                up being really useful for building application UIs because
                                you spend less time undoing user-agent styles, but when you <em>really are</em> just trying to style
                                some content that came from a rich-text
                                editor in a CMS or a markdown file, it can be surprising and
                                unintuitive.
                            </p>
                        </div>
                    </figure>
                    <!-- ROW -->
                    <figure class="my-8 pl-1 flex flex-row w-full text-stone-900 dark:text-stone-300">
                        <!-- ICON -->
                        <span >
                            <div class="h-4 w-4 text-stone-700 dark:text-stone-400 cursor-pointer mt-1  ml-0  mr-0">
                                <FaList />
                            </div>
                        </span>
                        <!-- TEXT BLOCK -->
                        <div class="ml-3 w-full py-0">
                            <h4 class="text-base font-bold whitespace-nowrap overflow-clip w-full ">
                                Since this is a list, I need at least two items.
                            </h4>
                            <p class="mt-3 text-sm font-thin tracking-wide text-stone-600 dark:text-stone-200">
                                By default, Tailwind removes all of the default browser
                                styling from paragraphs, headings, lists and more. This ends
                                up being really useful for building application UIs because
                                you spend less time undoing user-agent styles, but when you <em>really are</em> just trying to style
                                some content that came from a rich-text
                                editor in a CMS or a markdown file, it can be surprising and
                                unintuitive.
                            </p>

                        </div>
                    </figure>
                    <!-- ROW -->
                    <figure class="my-8 pl-1 flex flex-row w-full text-stone-900 dark:text-stone-300">
                        <!-- ICON -->
                        <span >
                            <div class="mt-7 h-4 w-4 text-orange-700 dark:text-orange-400 cursor-pointer ml-0  mr-0">
                                <FaList />
                            </div>
                        </span>
                        <!-- TEXT BLOCK -->
                        <div class="ml-3 w-full py-0">
                        <div class="text-sm font-thin text-stone-600 dark:text-stone-400">
                            <div class="grid gap-4 grid-cols-3 grid-rows-1">
                                <span>OCT-254</span>
                                <span class="text-center">Ready</span>
                                <span class="text-right">15 listopad 25</span>
                            </div>
                        </div>

                            <h4 class="mt-1 text-base font-bold whitespace-nowrap overflow-clip w-full ">
                                It's not a bad idea to add a third item either items.
                            </h4>
                        <div class="mt-3 text-sm font-thin tracking-wide text-stone-600 dark:text-stone-200">
                            <div class="grid gap-4 grid-cols-2 grid-rows-1">
                                <span class = "text-orange-600 dark:text-orange-500">Specyfikacja | Octopus</span>

                                <span class="text-right">Andrzej</span>
                            </div>
                        </div>

                        <p class="mt-3 text-sm font-thin tracking-wide text-stone-600 dark:text-stone-200">
                            I think it probably would've been fine to just use
                            two items but three is definitely not worse, and
                            since I seem to be having no trouble making up
                            arbitrary things to type, I might as well include
                            it.
                        </p>

                        </div>
                    </figure>
                    <!-- ROW -->
                    <figure class="my-8 pl-1 flex flex-row w-full text-stone-900 dark:text-stone-300">
                        <!-- ICON -->
                        <span >
                            <div class="mt-7 h-4 w-4 text-orange-700 dark:text-orange-400 cursor-pointer ml-0  mr-0">
                                <FaList />
                            </div>
                        </span>
                        <!-- TEXT BLOCK -->
                        <div class="ml-3 w-full py-0">
                        <div class="text-sm font-thin text-stone-600 dark:text-stone-400">
                            <div class="grid gap-4 grid-cols-3 grid-rows-1">
                                <span>OCT-254</span>
                                <span class="text-center">Ready</span>
                                <span class="text-right">15 listopad 25</span>
                            </div>
                        </div>

                            <h4 class="mt-1 text-base font-bold whitespace-nowrap overflow-clip w-full ">
                                It's not a bad idea to add a third item either items.
                            </h4>

                        <p class="mt-3 text-sm font-thin tracking-wide text-stone-600 dark:text-stone-200">
                            I think it probably would've been fine to just use
                            two items but three is definitely not worse, and
                            since I seem to be having no trouble making up
                            arbitrary things to type, I might as well include
                            it.
                        </p>

                        </div>
                    </figure>









                </div>
                <p class="mt-5 mb-5 leading-7">
                    After this sort of list I usually have a closing statement
                    or paragraph, because it kinda looks weird jumping right to
                    a heading.
                </p>
















                <h2 class="text-2xl font-bold mt-14 mb-6 leading-7">Lista elementów bez ikon z summary</h2>
                <p class="mt-5 mb-5 leading-7">Elementy na kanbanie przypominają figury z opisami oraz wytłuszczonym
                    tytułem
                    elementu.</p>
                <figure class="my-8">
                    <figcaption class="text-sm font-thin text-stone-600 dark:text-stone-400">
                        <div class="grid gap-4 grid-cols-3 grid-rows-1">
                            <span>OCT-254</span>
                            <span class="text-center">Ready</span>
                            <span class="text-right">15 listopad 25</span>
                        </div>
                    </figcaption>
                    <h4 class="mt-1 font-bold text-base text-stone-600 dark:text-stone-200">
                        Kafelek kanbana lub artykułu z maksymalną liczbą dodatkowych atrybutów
                    </h4>
                    <figcaption class="mt-3 text-sm font-thin tracking-wide text-stone-600 dark:text-stone-200">
                        <div class="grid gap-4 grid-cols-3 grid-rows-1">
                            <span>Andrzej</span>
                            <span class="text-center">HD</span>
                            <span class="text-right">Specyfikacje</span>
                        </div>
                    </figcaption>
                    <figcaption class="mt-3 text-sm font-thin tracking-wide text-stone-600 dark:text-stone-200">
                        Nad tytułem mamy nawet trzy elementy. Podobie pod tytułem. Dodatkowo po podsumowaniu możemy
                        mieć znowu matrycę kolejnych atrybutów, ale to tylko w bardzo specyficznych sytuacjach.
                    </figcaption>
                    <figcaption class="mt-3 text-sm font-thin text-stone-600 dark:text-stone-200">
                        <div class="grid gap-1 grid-cols-3">
                            <span>01</span>
                            <span class="text-center">02</span>
                            <span class="text-right">03</span>
                            <span>04</span>
                            <span class="text-center">05</span>
                            <span class="text-right">06</span>
                        </div>
                    </figcaption>
                </figure>
                <figure class="my-8">
                    <figcaption class="text-sm font-thin text-stone-600 dark:text-stone-400">
                        <div class="grid gap-4 grid-cols-3 grid-rows-1">
                            <span>OCT-258</span>
                            <span class="text-center"></span>
                            <span class="text-right">24 listopad 25</span>
                        </div>
                    </figcaption>
                    <h4 class="mt-1 font-bold text-base text-stone-600 dark:text-stone-200">
                        Matrycy dodatkowych atrybutów nie używamy często.
                    </h4>
                    <figcaption class="mt-3 text-sm font-thin tracking-wide text-stone-600 dark:text-stone-200">
                        <div class="grid gap-4 grid-cols-3 grid-rows-1">
                            <span>Andrzej</span>
                            <span class="text-center"></span>
                            <span class="text-right">Specyfikacje</span>
                        </div>
                    </figcaption>
                    <figcaption class="mt-3 text-sm font-thin tracking-wide text-stone-600 dark:text-stone-200">
                        Informacje nad i pod tytułem wydają się wystrczające. Problematyczne mogą być tagi.
                        Może pisać je pod podsumowaniem wyrównywane do prawej?
                    </figcaption>
                    <figcaption class="mt-3 text-right text-sm font-thin tracking-wide text-orange-600 dark:text-orange-500">
                        Specyfikacja | Octopus | Frontend
                    </figcaption>

                </figure>
                <!--TAIL------------------->
                <figure class="my-8">
                    <figcaption class="text-sm font-thin text-stone-600 dark:text-stone-400">
                        <div class="grid gap-4 grid-cols-3 grid-rows-1">
                            <span>OCT-258</span>
                            <span class="text-center">Specyfikacje</span>
                            <span class="text-right">24 listopad 25</span>
                        </div>
                    </figcaption>
                    <h4 class="mt-1 font-bold text-base text-stone-600 dark:text-stone-200">
                        Najlepiej ograniczyć ilość atrybutów.
                    </h4>
                    <figcaption class="mt-3 text-sm font-thin tracking-wide text-stone-600 dark:text-stone-200">
                        <div class="grid gap-4 grid-cols-2 grid-rows-1">
                            <span class = "text-orange-600 dark:text-orange-500">Specyfikacja | Octopus | Frontend</span>

                            <span class="text-right">Andrzej</span>
                        </div>
                    </figcaption>
                    <figcaption class="mt-3 text-sm font-thin tracking-wide text-stone-600 dark:text-stone-200">
                        Jeżeli można to ograniczamy ilość dodatkowych atrybutów do pięciu i tagi
                        - według standardów gazetowych umieszczać pod tytułem.
                        Gdy jest ich wiecej, może sie wydawać, że zasłaniają tytuł, ale chyba nie jest tak źle.
                    </figcaption>
                </figure>

                <!--TAIL------------------->
                <figure class="my-8">
                    <figcaption class="text-sm font-thin text-stone-600 dark:text-stone-400">
                        <div class="grid gap-4 grid-cols-3 grid-rows-1">
                            <span>OCT-258</span>
                            <span class="text-center">Specyfikacje</span>
                            <span class="text-right">24 listopad 25</span>
                        </div>
                    </figcaption>
                    <h4 class="mt-1 font-bold text-base text-stone-600 dark:text-stone-200">
                        Prosty element listy - bez podsumowania.
                    </h4>
                    <figcaption class="mt-3 text-sm font-thin tracking-wide text-stone-600 dark:text-stone-200">
                        <div class="grid gap-4 grid-cols-2 grid-rows-1">
                            <span class = "text-orange-600 dark:text-orange-500">Frontend</span>

                            <span class="text-right">Andrzej</span>
                        </div>
                    </figcaption>
                </figure>

                <!--TAIL------------------->
                <figure class="my-8">
                    <figcaption class="text-sm font-thin text-stone-600 dark:text-stone-400">
                        <div class="grid gap-4 grid-cols-3 grid-rows-1">
                            <span>OCT-258</span>
                            <span class="text-center">Specyfikacje</span>
                            <span class="text-right">24 listopad 25</span>
                        </div>
                    </figcaption>
                    <h4 class="mt-1 font-bold text-base text-stone-600 dark:text-stone-200">
                        Prosty element listy - bez podsumowania.
                    </h4>
                    <figcaption class="mt-3 text-sm font-thin tracking-wide text-stone-600 dark:text-stone-200">
                        <div class="grid gap-4 grid-cols-2 grid-rows-1">
                            <span class = "text-orange-600 dark:text-orange-500">Frontend</span>

                            <span class="text-right">Andrzej</span>
                        </div>
                    </figcaption>
                </figure>
                <!--TAIL------------------->
                <figure class="my-8">
                    <h4 class="mt-1 font-bold text-base text-stone-600 dark:text-stone-200">
                        Prosty element listy - bez atrybutów powyżej.
                    </h4>
                    <figcaption class="mt-3 text-sm font-thin tracking-wide text-stone-600 dark:text-stone-200">
                        <div class="grid gap-4 grid-cols-2 grid-rows-1">
                            <span class = "text-orange-600 dark:text-orange-500">Frontend</span>

                            <span class="text-right">Andrzej</span>
                        </div>
                    </figcaption>
                </figure>
                <!--TAIL------------------->
                <figure class="my-8">
                    <h4 class="mt-1 font-bold text-base text-stone-600 dark:text-stone-200">
                        Prosty element listy - bez atrybutów powyżej.
                    </h4>
                    <figcaption class="mt-3 text-sm font-thin tracking-wide text-stone-600 dark:text-stone-200">
                        <div class="grid gap-4 grid-cols-2 grid-rows-1">
                            <span class = "text-orange-600 dark:text-orange-500">Frontend</span>

                            <span class="text-right">Andrzej</span>
                        </div>
                    </figcaption>
                </figure>
                <!--TAIL------------------->
                <figure class="my-8">
                    <h4 class="mt-1 font-bold text-base text-stone-600 dark:text-stone-200">
                        Tylko tytuł.
                    </h4>
                </figure>
                <!--TAIL------------------->
                <figure class="my-8">
                    <h4 class="mt-1 font-bold text-base text-stone-600 dark:text-stone-200">
                        Tylko tytuł.
                    </h4>
                </figure>
                <!--TAIL------------------->
                <figure class="my-8">
                    <h4 class="mt-1 font-bold text-base text-stone-600 dark:text-stone-200">
                        Tylko tytuł.
                    </h4>
                </figure>
                <!--TAIL------------------->
                <figure class="my-8">
                    <h4 class="mt-1 font-bold text-base text-stone-600 dark:text-stone-200">
                        Tylko tytuł.
                    </h4>
                </figure>

                <!--TAIL------------------->
                <figure class="my-8">
                    <h4 class="mt-1 font-bold text-base text-stone-600 dark:text-stone-200">
                        Element listy wyłacznie z tytułem i opisem.
                    </h4>
                    <figcaption class="mt-3 text-sm font-thin tracking-wide text-stone-600 dark:text-stone-200">
                    By default, Tailwind removes all of the default browser
                    styling from paragraphs, headings, lists and more. This ends
                    up being really useful for building application UIs because
                    you spend less time undoing user-agent styles, but when you <em>really are</em> just trying to style
                    some content that came from a rich-text
                    editor in a CMS or a markdown file, it can be surprising and
                    unintuitive.
                    </figcaption>
                </figure>

                <!--TAIL------------------->
                <figure class="my-8">
                    <figcaption class="text-sm font-thin text-stone-600 dark:text-stone-400">
                        <div class="grid gap-4 grid-cols-3 grid-rows-1">
                            <span>OCT-258</span>
                            <span class="text-center">Specyfikacje</span>
                            <span class="text-right">24 listopad 25</span>
                        </div>
                    </figcaption>
                    <h4 class="mt-1 font-bold text-base text-stone-600 dark:text-stone-200">
                        Najlepiej ograniczyć ilość atrybutów.
                    </h4>
                    <figcaption class="mt-3 text-sm font-thin tracking-wide text-stone-600 dark:text-stone-200">
                        <div class="grid gap-4 grid-cols-2 grid-rows-1">
                            <span class = "text-orange-600 dark:text-orange-500">Specyfikacja | Octopus | Frontend</span>

                            <span class="text-right">Andrzej</span>
                        </div>
                    </figcaption>
                    <figcaption class="mt-3 text-sm font-thin tracking-wide text-stone-600 dark:text-stone-200">
                        Jeżeli można to ograniczamy ilość dodatkowych atrybutów do pięciu i tagi
                        - według standardów gazetowych umieszczać pod tytułem.
                        Gdy jest ich wiecej, może sie wydawać, że zasłaniają tytuł, ale chyba nie jest tak źle.
                    </figcaption>
                </figure>



                <p class="text-base font-normal my-5 leading-7">
                    By default, Tailwind removes all of the default browser
                    styling from paragraphs, headings, lists and more. This ends
                    up being really useful for building application UIs because
                    you spend less time undoing user-agent styles, but when you <em>really are</em> just trying to style
                    some content that came from a rich-text
                    editor in a CMS or a markdown file, it can be surprising and
                    unintuitive.
                </p>
                <p class="text-base font-thin my-5 leading-7">
                    We get lots of complaints about it actually, with people
                    regularly asking us things like:
                </p>
                <div class="pl-4 my-6">
                    <blockquote>
                        <p class="text-base italic font-thin  my-5 leading-7">
                            Why is Tailwind removing the default styles on my <code>h1</code> elements? How do I disable
                            this? What do you mean I lose
                            all the other base styles too?
                        </p>

                    </blockquote>
                    <!--!div class="absolute h-12 -top-4 -right-20 bg-yellow-300">
                        <p>Comment</p>
                    </--div-->
                </div>
                <p class="text-base font-thin my-5 leading-7">
                    We hear you, but we're not convinced that simply disabling
                    our base styles is what you really want. You don't want to
                    have to remove annoying margins every time you use a <code>p</code>
                    element in a piece of your dashboard UI. And I doubt you
                    really want your blog posts to use the user-agent styles
                    either — you want them to look <em>awesome</em>, not awful.
                </p>
                <figure class="my-8">
                    <figcaption class="text-sm font-thin mt-3 leading-5 tracking-wide">
                        The <code>@tailwindcss/typography</code> plugin is our
                        attempt to give you what you <em>actually</em> want, without
                        any of the downsides of doing something stupid like disabling
                        our base styles.
                    </figcaption>
                    <figcaption class="text-sm font-thin mt-3 leading-5 tracking-wide">
                        It adds a new <code>prose</code> class that you can slap on any
                        block of vanilla HTML content and turn it into a beautiful, well-formatted
                        document:
                    </figcaption>
                </figure>
                <p class="text-base font-thin my-5 leading-7">
                    It adds a new <code>prose</code> class that you can slap on any
                    block of vanilla HTML content and turn it into a beautiful, well-formatted
                    document:
                </p>
                <hr class="font-thin my-12" />
                <h2 class="text-2xl font-bold mb-6 leading-7">What to expect from here on out</h2>
                <p class="font-thin my-5 leading-7">
                    It's important to cover all of these use cases for a few
                    reasons:
                </p>
                <ol class="my-5 pl-7">
                    <li class="pl-2 font-thin my-2 leading-7">We want everything to look good out of the box.</li>
                    <li class="pl-2 font-normal my-2 leading-7">
                        Really just the first reason, that's the whole point of
                        the plugin.
                    </li>
                    <li class="pl-2 font-normal my-2 leading-7">
                        Here's a third pretend reason though a list with three
                        items looks more realistic than a list with two items.
                    </li>
                </ol>
                <p class="font-thin my-5 leading-7">
                    Now we're going to try out another header style.
                </p>
                <h3 class="text-xl font-bold mt-8 mb-3 leading-7">Typography should be easy</h3>
                <p class="font-thin my-5 leading-7">
                    Something a wise person once told me about typography is:
                </p>
                <figure class="my-5 py-2">
                    <img src="https://images.unsplash.com/photo-1556740758-90de374c12ad?ixlib=rb-1.2.1&amp;ixid=eyJhcHBfaWQiOjEyMDd9&amp;auto=format&amp;fit=crop&amp;w=1000&amp;q=80"
                        alt="" />
                    <figcaption class="text-sm font-thin mt-3 leading-5 tracking-wide">
                        Contrary to popular belief, Lorem Ipsum is not simply
                        random text. It has roots in a piece of classical Latin
                        literature from 45 BC, making it over 2000 years old.
                    </figcaption>
                </figure>
                <p class="font-thin my-5 leading-7">
                    And that's the end of this section.</p>
                <h2 class="text-2xl font-bold mt-12 mb-6 leading-7">What if we stack headings?</h2>
                <h3 class="text-xl font-bold mt-8 mb-3 leading-7">We should make sure that looks good, too.</h3>
                <p class="font-thin my-5 leading-7">
                    Sometimes you have headings directly underneath each other.
                    In those cases you often have to undo the top margin on the
                    second heading because it usually looks better for the
                    headings to be closer together than a paragraph followed by
                    a heading should be.
                </p>
                <h3 class="text-xl font-bold mt-8 mb-3 leading-7">When a heading comes after a paragraph …</h3>
                <p class="font-thin mb-5 leading-7">
                    When a heading comes after a paragraph, we need a bit more
                    space, like I already mentioned above. Now let's see what a
                    more complex list would look like.
                </p>
                <ul class="my-5 pl-7">
                    <li class="my-1 pl-2">
                        <p class="mt-5 mb-3 leading-7">
                            <strong>I often do this thing where list items have
                                headings.</strong>
                        </p>
                        <p class="mt-3 mb-3  leading-7">
                            For some reason I think this looks cool which is
                            unfortunate because it's pretty annoying to get the
                            styles right.
                        </p>
                        <p class="mt-3 mb-5 leading-7">
                            I often have two or three paragraphs in these list
                            items, too, so the hard part is getting the spacing
                            between the paragraphs, list item heading, and
                            separate list items to all make sense. Pretty tough
                            honestly, you could make a strong argument that you
                            just shouldn't write this way.
                        </p>
                    </li>
                    <li class="my-1 pl-2">
                        <p class="mt-5 mb-3 leading-7">
                            <strong>Since this is a list, I need at least two
                                items.</strong>
                        </p>
                        <p class="mt-3 mb-5 leading-7">
                            I explained what I'm doing already in the previous
                            list item, but a list wouldn't be a list if it only
                            had one item, and we really want this to look
                            realistic. That's why I've added this second list
                            item so I actually have something to look at when
                            writing the styles.
                        </p>
                    </li>
                    <li class="my-1 pl-2">
                        <p class="mt-5 mb-3 leading-7">
                            <strong>It's not a bad idea to add a third item either.</strong>
                        </p>
                        <p class="mt-3 mb-5 leading-7">
                            I think it probably would've been fine to just use
                            two items but three is definitely not worse, and
                            since I seem to be having no trouble making up
                            arbitrary things to type, I might as well include
                            it.
                        </p>
                    </li>
                </ul>
                <p class="mt-5 mb-5 leading-7">
                    After this sort of list I usually have a closing statement
                    or paragraph, because it kinda looks weird jumping right to
                    a heading.
                </p>

                <h2 class="text-2xl font-bold mt-12 mb-6 leading-7">There are other elements we need to style</h2>

                <p class="mt-5 mb-5 leading-7">We even included table styles, check it out:</p>
                <table>
                    <thead>
                        <tr>
                            <th>Wrestler</th>
                            <th>Origin</th>
                            <th>Finisher</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Bret "The Hitman" Hart</td>
                            <td>Calgary, AB</td>
                            <td>Sharpshooter</td>
                        </tr>
                        <tr>
                            <td>Stone Cold Steve Austin</td>
                            <td>Austin, TX</td>
                            <td>Stone Cold Stunner</td>
                        </tr>
                        <tr>
                            <td>Randy Savage</td>
                            <td>Sarasota, FL</td>
                            <td>Elbow Drop</td>
                        </tr>
                        <tr>
                            <td>Vader</td>
                            <td>Boulder, CO</td>
                            <td>Vader Bomb</td>
                        </tr>
                        <tr>
                            <td>Razor Ramon</td>
                            <td>Chuluota, FL</td>
                            <td>Razor's Edge</td>
                        </tr>
                    </tbody>
                </table>
                <p>
                    We also need to make sure inline code looks good, like if I
                    wanted to talk about <code>&lt;span&gt;</code> elements or
                    tell you the good news about
                    <code>@tailwindcss/typography</code>.
                </p>

                <div>
                    <!--class="relative w-full px-6 py-12 shadow-xl shadow-slate-700/10 ring-1 ring-gray-900/5 md:max-w-3xl md:mx-auto lg:max-w-4xl lg:pt-16 lg:pb-28"-->
                    <div class="w-full prose prose-base prose-zinc dark:prose-invert ">
                        <h2>There are other elements we need to style</h2>
                        <h3>Sometimes I even use <code>code</code> in headings</h3>
                        <p>
                            Even though it's probably a bad idea, and historically I've
                            had a hard time making it look good. This <em>"wrap the code blocks in backticks"</em> trick
                            works
                            pretty well though really.
                        </p>
                        <p>
                            Another thing I've done in the past is put a <code>code</code>
                            tag inside of a link, like if I wanted to tell you about the
                            <a href="https://github.com/tailwindcss/docs"><code>tailwindcss/docs</code></a> repository.
                            I
                            don't
                            love that there is an underline below the
                            backticks but it is absolutely not worth the madness it would
                            require to avoid it.
                        </p>
                        <h4>We haven't used an <code>h4</code> yet</h4>
                        <p>
                            But now we have. Please don't use <code>h5</code> or
                            <code>h6</code>
                            in your content, Medium only supports two heading levels for
                            a reason, you animals. I honestly considered using a
                            <code>before</code>
                            pseudo-element to scream at you if you use an
                            <code>h5</code>
                            or <code>h6</code>.
                        </p>
                        <p>
                            We don't style them at all out of the box because <code>h4</code>
                            elements are already so small that they are the same size as
                            the body copy. What are we supposed to do with an
                            <code>h5</code>, make it <em>smaller</em> than the body copy?
                            No thanks.
                        </p>
                        <h3>We still need to think about stacked headings though.</h3>
                        <h4>
                            Let's make sure we don't screw that up with <code>h4</code> elements,
                            either.
                        </h4>
                        <p>
                            Phew, with any luck we have styled the headings above this
                            text and they look pretty good.
                        </p>
                        <p>
                            Let's add a closing paragraph here so things end with a
                            decently sized block of text. I can't explain why I want
                            things to end that way but I have to assume it's because I
                            think things will look weird or unbalanced if there is a
                            heading too close to the end of the document.
                        </p>
                        <p>
                            What I've written here is probably long enough, but adding
                            this final sentence can't hurt.
                        </p>
                    </div>
                </div>
            </div>

            <!--/CONTENT------------------------------------------------------------------------------------------------>

        </div>
        <!--COLUMN------------------------------------------------------------------------------------------------->
        <div class="    snap-center
                    sm:snap-align-none
                    flex-none sm:flex-1
                    sm:min-h-[calc(100vh-8rem)]
                    min-h-[calc(100vh-5rem)]
                    rounded-md border border-transparent
                " style={dsColumnWidth}>

            <!--CONTENT------------------------------------------------------------------------------------------------->
            <!--CONTENT------------------------------------------------------------------------------------------------->
            <!--CT NTENT------------------------------------------------------------------------------------------------>
            <!--C2NTENT------------------------------------------------------------------------------------------------->
            <div class="px-4">
                <!--class="relative w-full px-6 py-12 shadow-xl shadow-slate-700/10 ring-1 ring-gray-900/5 md:max-w-3xl md:mx-auto lg:max-w-4xl lg:pt-16 lg:pb-28"-->
                <div class="w-full prose prose-base prose-zinc dark:prose-invert ">
                    <h1>Typography List%</h1>
                    <h2>Typo Lista z ikonami</h2>
                    <!--row 1------------------------------------------------------------------------------------------->
                    <figure class="pl-8">
                        <h4 class="-indent-8">
                            <div class="inline-block text-stone-700 dark:text-stone-400 h-4 w-4 ml-1 mr-2">
                                <FaList />
                            </div>
                            I often do this thing where list items have headings.
                        </h4>
                        <figcaption>
                                By default, Tailwind removes all of the default browser
                                styling from paragraphs, headings, lists and more. This ends
                                up being really useful for building application UIs because
                                you spend less time undoing user-agent styles, but when you <em>really are</em> just trying to style
                                some content that came from a rich-text
                                editor in a CMS or a markdown file, it can be surprising and
                                unintuitive.
                        </figcaption>
                    </figure>
                    <!--row 2------------------------------------------------------------------------------------------->

                    <figure class="pl-8">
                        <h4 class="-indent-8">
                            <div class="inline-block w-4 h-4 ml-1 mr-2 align-baseline
                                        text-stone-700 dark:text-stone-400 ">
                                <FaList />
                            </div>
                            Since this is a list, I need at least two items.
                        </h4>
                        <figcaption>
                                By default, Tailwind removes all of the default browser
                                styling from paragraphs, headings, lists and more. This ends
                                up being really useful for building application UIs because
                                you spend less time undoing user-agent styles, but when you <em>really are</em> just trying to style
                                some content that came from a rich-text
                                editor in a CMS or a markdown file, it can be surprising and
                                unintuitive.
                        </figcaption>
                    </figure>

                    <!--row 3------------------------------------------------------------------------------------------->
                    <figure class="pl-8">
                        <figcaption>
                            <div class="grid gap-4 grid-cols-3 grid-rows-1">
                                <span>OCT-254</span>
                                <span class="text-center"></span>
                                <span class="text-right">15 listopad 25</span>
                            </div>
                        </figcaption>
                        <h4 class="mt-1 -indent-8 ">
                                <div class="inline-block w-4 h-4 ml-0 mr-3 align-baseline
                                        text-stone-700 dark:text-stone-400 ">
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-calculator-icon lucide-calculator"><rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="16" x2="16" y1="14" y2="18"/><path d="M16 10h.01"/><path d="M12 10h.01"/><path d="M8 10h.01"/><path d="M12 14h.01"/><path d="M8 14h.01"/><path d="M12 18h.01"/><path d="M8 18h.01"/></svg>                                </div>
                                Since this is a list, I need at least two items.
                        </h4>


                        <figcaption>
                            <div class="grid gap-4 grid-cols-3 grid-rows-1">
                                <span>Andrzej</span>
                                <span class="text-center"></span>
                                <span class="text-right">Specyfikacje</span>
                            </div>
                        </figcaption>
                        <figcaption>
                            Bardzo kusząca wydaje sie opcja, by usunąć z interfejsu jakiekolwiek formatowania i zdać sie
                            na typografię, jednak istnieje poważne zagrożenie, że w takiej sytuacji nie będdziemy mogli
                            zrobić wszystkiego, co jest potrzebne.
                        </figcaption>
                    </figure>
                    <!--row 4------------------------------------------------------------------------------------------->
                    <figure class="pl-8">
                        <figcaption>
                            <div class="grid gap-4 grid-cols-3 grid-rows-1">
                                <span>OCT-254</span>
                                <span class="text-center"></span>
                                <span class="text-right">15 listopad 25</span>
                            </div>
                        </figcaption>
                        <h4 class="mt-1 -indent-8 ">
                                <div class="inline-block w-4 h-4 ml-0 mr-3 align-baseline
                                        text-stone-700 dark:text-stone-400 ">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                    stroke-width="1" stroke-linecap="round" stroke-linejoin="round"
                                    class="lucide lucide-circuit-board-icon lucide-circuit-board">
                                    <rect width="18" height="18" x="3" y="3" rx="2" />
                                    <path d="M11 9h4a2 2 0 0 0 2-2V3" />
                                    <circle cx="9" cy="9" r="2" />
                                    <path d="M7 21v-4a2 2 0 0 1 2-2h4" />
                                    <circle cx="15" cy="15" r="2" />
                                </svg>
                                </div>
                                Since this is a list, I need at least two items.
                        </h4>


                        <figcaption>
                            <div class="grid gap-4 grid-cols-3 grid-rows-1">
                                <span>Andrzej</span>
                                <span class="text-center"></span>
                                <span class="text-right">Specyfikacje</span>
                            </div>
                        </figcaption>
                        <figcaption>
                            Bardzo kusząca wydaje sie opcja, by usunąć z interfejsu jakiekolwiek formatowania i zdać sie
                            na typografię, jednak istnieje poważne zagrożenie, że w takiej sytuacji nie będdziemy mogli
                            zrobić wszystkiego, co jest potrzebne.
                        </figcaption>
                    </figure>


                                        <!-- ROW -->
                    <figure class="my-8 pl-1 flex flex-row w-full text-stone-900 dark:text-stone-300">
                        <!-- ICON -->
                        <span >
                            <div class="mt-7 h-4 w-4 text-orange-700 dark:text-orange-400 cursor-pointer ml-0  mr-0">
                                <FaList />
                            </div>
                        </span>
                        <!-- TEXT BLOCK -->
                        <div class="ml-3 w-full py-0">
                        <div class="text-sm font-thin text-stone-600 dark:text-stone-400">
                            <div class="grid gap-4 grid-cols-3 grid-rows-1">
                                <span>OCT-254</span>
                                <span class="text-center">Ready</span>
                                <span class="text-right">15 listopad 25</span>
                            </div>
                        </div>

                            <h4 class="mt-1 text-base font-bold whitespace-nowrap overflow-clip w-full ">
                                It's not a bad idea to add a third item either items.
                            </h4>
                        <div class="mt-3 text-sm font-thin tracking-wide text-stone-600 dark:text-stone-200">
                            <div class="grid gap-4 grid-cols-2 grid-rows-1">
                                <span class = "text-orange-600 dark:text-orange-500">Specyfikacja | Octopus</span>

                                <span class="text-right">Andrzej</span>
                            </div>
                        </div>

                        <p class="mt-3 text-sm font-thin tracking-wide text-stone-600 dark:text-stone-200">
                            I think it probably would've been fine to just use
                            two items but three is definitely not worse, and
                            since I seem to be having no trouble making up
                            arbitrary things to type, I might as well include
                            it.
                        </p>

                        </div>
                    </figure>
                    <!-- ROW -->
                    <figure class="my-8 pl-1 flex flex-row w-full text-stone-900 dark:text-stone-300">
                        <!-- ICON -->
                        <span >
                            <div class="mt-7 h-4 w-4 text-orange-700 dark:text-orange-400 cursor-pointer ml-0  mr-0">
                                <FaList />
                            </div>
                        </span>
                        <!-- TEXT BLOCK -->
                        <div class="ml-3 w-full py-0">
                        <div class="text-sm font-thin text-stone-600 dark:text-stone-400">
                            <div class="grid gap-4 grid-cols-3 grid-rows-1">
                                <span>OCT-254</span>
                                <span class="text-center">Ready</span>
                                <span class="text-right">15 listopad 25</span>
                            </div>
                        </div>

                            <h4 class="mt-1 text-base font-bold whitespace-nowrap overflow-clip w-full ">
                                It's not a bad idea to add a third item either items.
                            </h4>

                        <p class="mt-3 text-sm font-thin tracking-wide text-stone-600 dark:text-stone-200">
                            I think it probably would've been fine to just use
                            two items but three is definitely not worse, and
                            since I seem to be having no trouble making up
                            arbitrary things to type, I might as well include
                            it.
                        </p>

                        </div>
                    </figure>



                     <figure class="pl-8">
                        <figcaption>
                            <div class="grid gap-4 grid-cols-3 grid-rows-1">
                                <span>OCT-254</span>
                                <span class="text-center">Ready</span>
                                <span class="text-right">15 listopad 25</span>
                            </div>
                        </figcaption>
                        <h4 class="-indent-8">
                            <div class="inline-block text-green-600 h-4 w-4 ml-1.5 mr-2">
                                <FaArchive />
                            </div>
                            Jednoznaczne zasady budowy elementow interfejsu
                        </h4>
                        <figcaption>
                            Typografia bardzo pomaga ale jej zasady są z definicji ukryte i nie pokrywają do wszystkich
                            układów interfejsu użytkownika.
                        </figcaption>
                        <figcaption>
                            <div class="grid gap-4 grid-cols-3">
                                <span>01</span>
                                <span class="text-center">02</span>
                                <span class="text-right">03</span>
                                <span>04</span>
                                <span class="text-center">05</span>
                                <span class="text-right">06</span>
                            </div>
                        </figcaption>
                    </figure>


                    <h4 class="ml-8 -indent-8">
                        <div class="inline-block text-green-600 h-4 w-4 ml-1 mr-2">
                                <FaList />
                        </div>

                        I often do this thing where list items have headings.
                    </h4>
                    <h2>Lista elementów z ikonami z summary</h2>
                    <p>Elementy na kanbanie przypominają figury z opisami oraz wytłuszczonym tytułem elementu.</p>
                    <figure class="pl-8">
                        <figcaption>
                            <div class="grid gap-4 grid-cols-3 grid-rows-1">
                                <span>OCT-254</span>
                                <span class="text-center">Ready</span>
                                <span class="text-right">15 listopad 25</span>
                            </div>
                        </figcaption>
                        <h4 class="-indent-8">
                            <div class="inline-block text-green-600 h-3.5 w-3.5 ml-1.5 mr-2">
                                <FaArchive />
                            </div>
                            Jednoznaczne zasady budowy elementow interfejsu
                        </h4>
                        <figcaption>
                            Typografia bardzo pomaga ale jej zasady są z definicji ukryte i nie pokrywają do wszystkich
                            układów interfejsu użytkownika.
                        </figcaption>
                        <figcaption>
                            <div class="grid gap-4 grid-cols-3">
                                <span>01</span>
                                <span class="text-center">02</span>
                                <span class="text-right">03</span>
                                <span>04</span>
                                <span class="text-center">05</span>
                                <span class="text-right">06</span>
                            </div>
                        </figcaption>
                    </figure>

                    <h2>Lista elementów bez ikon z summary</h2>
                    <p>Elementy na kanbanie przypominają figury z opisami oraz wytłuszczonym tytułem elementu.</p>
                    <figure>
                        <figcaption>
                            <div class="grid gap-4 grid-cols-3 grid-rows-1">
                                <span>OCT-254</span>
                                <span class="text-center">Ready</span>
                                <span class="text-right">15 listopad 25</span>
                            </div>
                        </figcaption>
                        <h4>Jednoznaczne zasady budowy elementow interfejsu</h4>
                        <figcaption>
                            Typografia bardzo pomaga ale jej zasady są z definicji ukryte i nie pokrywają do wszystkich
                            układów interfejsu użytkownika.
                        </figcaption>
                        <figcaption>
                            <div class="grid gap-4 grid-cols-3">
                                <span>01</span>
                                <span class="text-center">02</span>
                                <span class="text-right">03</span>
                                <span>04</span>
                                <span class="text-center">05</span>
                                <span class="text-right">06</span>
                            </div>
                        </figcaption>
                    </figure>
                    <figure>
                        <figcaption>
                            <div class="grid gap-4 grid-cols-3 grid-rows-1">
                                <span>OCT-254</span>
                                <span class="text-center"></span>
                                <span class="text-right">15 listopad 25</span>
                            </div>
                        </figcaption>
                        <h4>Wybór metody budowania deklarowania elementów interfejsu</h4>
                        <figcaption>
                            <div class="grid gap-4 grid-cols-3 grid-rows-1">
                                <span>Andrzej</span>
                                <span class="text-center"></span>
                                <span class="text-right">Specyfikacje</span>
                            </div>
                        </figcaption>
                        <figcaption>
                            Bardzo kusząca wydaje sie opcja, by usunąć z interfejsu jakiekolwiek formatowania i zdać sie
                            na typografię, jednak istnieje poważne zagrożenie, że w takiej sytuacji nie będdziemy mogli
                            zrobić wszystkiego, co jest potrzebne.
                        </figcaption>
                    </figure>

                    <figure>
                        <h4>Element listy z opisem</h4>
                        <figcaption>
                            Contrary to popular belief, Lorem Ipsum is not simply
                            random text. It has roots in a piece of classical Latin
                            literature from 45 BC, making it over 2000 years old.
                        </figcaption>
                    </figure>
                    <figure>
                        <h4>Element listy bez opisu</h4>
                    </figure>
                    <figure>
                        <h4>Element listy bez opisu</h4>
                    </figure>

                    <p>
                        We get lots of complaints about it actually, with people
                        regularly asking us things like:
                    </p>
                    <div class="relative">
                        <blockquote>
                            <p>
                                Why is Tailwind removing the default styles on my <code>h1</code> elements? How do I
                                disable
                                this? What do you mean I lose
                                all the other base styles too?
                            </p>

                        </blockquote>
                        <!--!div class="absolute h-12 -top-4 -right-20 bg-yellow-300">
                        <p>Comment</p>
                    </--div-->
                    </div>
                    <p>
                        We hear you, but we're not convinced that simply disabling
                        our base styles is what you really want. You don't want to
                        have to remove annoying margins every time you use a <code>p</code>
                        element in a piece of your dashboard UI. And I doubt you
                        really want your blog posts to use the user-agent styles
                        either — you want them to look <em>awesome</em>, not awful.
                    </p>
                    <figure>
                        <figcaption>The <code>@tailwindcss/typography</code> plugin is our
                            attempt to give you what you <em>actually</em> want, without
                            any of the downsides of doing something stupid like disabling
                            our base styles.
                        </figcaption>
                        <figcaption>
                            It adds a new <code>prose</code> class that you can slap on any
                            block of vanilla HTML content and turn it into a beautiful, well-formatted
                            document:
                        </figcaption>
                    </figure>
                    <p>
                        It adds a new <code>prose</code> class that you can slap on any
                        block of vanilla HTML content and turn it into a beautiful, well-formatted
                        document:
                    </p>

                    <hr />
                    <h2>What to expect from here on out</h2>
                    <p>
                        It's important to cover all of these use cases for a few
                        reasons:
                    </p>
                    <ol>
                        <li>We want everything to look good out of the box.</li>
                        <li>
                            Really just the first reason, that's the whole point of
                            the plugin.
                        </li>
                        <li>
                            Here's a third pretend reason though a list with three
                            items looks more realistic than a list with two items.
                        </li>
                    </ol>
                    <p>Now we're going to try out another header style.</p>
                    <h3>Typography should be easy</h3>
                    <p>Something a wise person once told me about typography is:</p>
                    <figure>
                        <img src="https://images.unsplash.com/photo-1556740758-90de374c12ad?ixlib=rb-1.2.1&amp;ixid=eyJhcHBfaWQiOjEyMDd9&amp;auto=format&amp;fit=crop&amp;w=1000&amp;q=80"
                            alt="" />
                        <figcaption>
                            Contrary to popular belief, Lorem Ipsum is not simply
                            random text. It has roots in a piece of classical Latin
                            literature from 45 BC, making it over 2000 years old.
                        </figcaption>
                    </figure>
                    <p>And that's the end of this section.</p>
                    <h2>What if we stack headings?</h2>
                    <h3>We should make sure that looks good, too.</h3>
                    <p>
                        Sometimes you have headings directly underneath each other.
                        In those cases you often have to undo the top margin on the
                        second heading because it usually looks better for the
                        headings to be closer together than a paragraph followed by
                        a heading should be.
                    </p>
                    <h3>When a heading comes after a paragraph …</h3>
                    <p>
                        When a heading comes after a paragraph, we need a bit more
                        space, like I already mentioned above. Now let's see what a
                        more complex list would look like.
                    </p>
                    <ul>
                        <li>

                            <p>
                                <strong>I often do this thing where list items have
                                    headings.</strong>
                            </p>
                            <p>
                                For some reason I think this looks cool which is
                                unfortunate because it's pretty annoying to get the
                                styles right.
                            </p>
                            <p>
                                I often have two or three paragraphs in these list
                                items, too, so the hard part is getting the spacing
                                between the paragraphs, list item heading, and
                                separate list items to all make sense. Pretty tough
                                honestly, you could make a strong argument that you
                                just shouldn't write this way.
                            </p>
                        </li>
                        <li>
                            <p>
                                <strong>Since this is a list, I need at least two
                                    items.</strong>
                            </p>
                            <p>
                                I explained what I'm doing already in the previous
                                list item, but a list wouldn't be a list if it only
                                had one item, and we really want this to look
                                realistic. That's why I've added this second list
                                item so I actually have something to look at when
                                writing the styles.
                            </p>
                        </li>
                        <li>
                            <p>
                                <strong>It's not a bad idea to add a third item either.</strong>
                            </p>
                            <p>
                                I think it probably would've been fine to just use
                                two items but three is definitely not worse, and
                                since I seem to be having no trouble making up
                                arbitrary things to type, I might as well include
                                it.
                            </p>
                        </li>
                    </ul>
                    <p>
                        After this sort of list I usually have a closing statement
                        or paragraph, because it kinda looks weird jumping right to
                        a heading.
                    </p>

                    <h2>###There are other elements we need to style</h2>

                    <h3>Sometimes I even use <code>code</code> in headings</h3>
                    <p>
                        Even though it's probably a bad idea, and historically I've
                        had a hard time making it look good. This <em>"wrap the code blocks in backticks"</em> trick
                        works
                        pretty well though really.
                    </p>
                    <p>
                        Another thing I've done in the past is put a <code>code</code>
                        tag inside of a link, like if I wanted to tell you about the
                        <a href="https://github.com/tailwindcss/docs"><code>tailwindcss/docs</code></a> repository. I
                        don't
                        love that there is an underline below the
                        backticks but it is absolutely not worth the madness it would
                        require to avoid it.
                    </p>
                    <h4>We haven't used an <code>h4</code> yet</h4>
                    <p>
                        But now we have. Please don't use <code>h5</code> or
                        <code>h6</code>
                        in your content, Medium only supports two heading levels for
                        a reason, you animals. I honestly considered using a
                        <code>before</code>
                        pseudo-element to scream at you if you use an
                        <code>h5</code>
                        or <code>h6</code>.
                    </p>
                    <p>
                        We don't style them at all out of the box because <code>h4</code>
                        elements are already so small that they are the same size as
                        the body copy. What are we supposed to do with an
                        <code>h5</code>, make it <em>smaller</em> than the body copy?
                        No thanks.
                    </p>
                    <h3>We still need to think about stacked headings though.</h3>
                    <h4>
                        Let's make sure we don't screw that up with <code>h4</code> elements,
                        either.
                    </h4>
                    <p>
                        Phew, with any luck we have styled the headings above this
                        text and they look pretty good.
                    </p>
                    <p>
                        Let's add a closing paragraph here so things end with a
                        decently sized block of text. I can't explain why I want
                        things to end that way but I have to assume it's because I
                        think things will look weird or unbalanced if there is a
                        heading too close to the end of the document.
                    </p>
                    <p>
                        What I've written here is probably long enough, but adding
                        this final sentence can't hurt.
                    </p>



                    <h3>Lista z ikonami - nawigatory i explorer …</h3>
                    <p>
                        Lista z ikonami. Nawigatory i explorer.
                    </p>
                    <ul>
                        <li>

                            <p>
                                <strong>I often do this thing where list items have
                                    headings.</strong>
                            </p>
                            <p>
                                For some reason I think this looks cool which is
                                unfortunate because it's pretty annoying to get the
                                styles right.
                            </p>
                            <p>
                                I often have two or three paragraphs in these list
                                items, too, so the hard part is getting the spacing
                                between the paragraphs, list item heading, and
                                separate list items to all make sense. Pretty tough
                                honestly, you could make a strong argument that you
                                just shouldn't write this way.
                            </p>
                        </li>
                        <li>
                            <p>
                                <strong>Since this is a list, I need at least two
                                    items.</strong>
                            </p>
                            <p>
                                I explained what I'm doing already in the previous
                                list item, but a list wouldn't be a list if it only
                                had one item, and we really want this to look
                                realistic. That's why I've added this second list
                                item so I actually have something to look at when
                                writing the styles.
                            </p>
                        </li>
                        <li>
                            <p>
                                <strong>It's not a bad idea to add a third item either.</strong>
                            </p>
                            <p>
                                I think it probably would've been fine to just use
                                two items but three is definitely not worse, and
                                since I seem to be having no trouble making up
                                arbitrary things to type, I might as well include
                                it.
                            </p>
                        </li>
                    </ul>
                    <p>
                        After this sort of list I usually have a closing statement
                        or paragraph, because it kinda looks weird jumping right to
                        a heading.
                    </p>


                    <h2>TableTailwind elements we need to style</h2>
                    <p>We even included table styles, check it out:</p>
                    <table>
                        <thead>
                            <tr>
                                <th>Wrestler</th>
                                <th>Origin</th>
                                <th>Finisher</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Bret "The Hitman" Hart</td>
                                <td>Calgary, AB</td>
                                <td>Sharpshooter</td>
                            </tr>
                            <tr>
                                <td>Stone Cold Steve Austin</td>
                                <td>Austin, TX</td>
                                <td>Stone Cold Stunner</td>
                            </tr>
                            <tr>
                                <td>Randy Savage</td>
                                <td>Sarasota, FL</td>
                                <td>Elbow Drop</td>
                            </tr>
                            <tr>
                                <td>Vader</td>
                                <td>Boulder, CO</td>
                                <td>Vader Bomb</td>
                            </tr>
                            <tr>
                                <td>Razor Ramon</td>
                                <td>Chuluota, FL</td>
                                <td>Razor's Edge</td>
                            </tr>
                        </tbody>
                    </table>
                    <p>
                        We also need to make sure inline code looks good, like if I
                        wanted to talk about <code>&lt;span&gt;</code> elements or
                        tell you the good news about
                        <code>@tailwindcss/typography</code>.
                    </p>
                </div>
            </div>
        </div>
        <!--COLUMN------------------------------------------------------------------------------------------------->
        <!--COLUMN------------------------------------------------------------------------------------------------->
        <!--COLUMN------------------------------------------------------------------------------------------------->

    </div>
    <!--------------------------------------------------------------------------------------------------------->
    <!--/TABLE-------------------------------------------------------------------------------------------------->
    <!--------------------------------------------------------------------------------------------------------->
    <!--------------------------------------------------------------------------------------------------------->
    <!--------------------------------------------------------------------------------------------------------->
    <!--------------------------------------------------------------------------------------------------------->
    <!--------------------------------------------------------------------------------------------------------->
    <!--------------------------------------------------------------------------------------------------------->
    <!--------------------------------------------------------------------------------------------------------->
    <!--------------------------------------------------------------------------------------------------------->
    <!--------------------------------------------------------------------------------------------------------->
    <!--------------------------------------------------------------------------------------------------------->
    <!--------------------------------------------------------------------------------------------------------->

</div>