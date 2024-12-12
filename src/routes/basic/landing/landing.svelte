<script>
	import { signUpHRef } from '@humandialog/auth.svelte';
    import Header from './header.svelte'
    import Footer  from './footer.svelte';
    import {link} from 'svelte-spa-router'
	import Add from '../../layout/add.svelte';
</script>

<div class="min-h-screen h-screen overflow-x-hidden">

    <section class="bg-local bg-cover bg-stone-900" > <!-- style="background-image: url(b-sv1.jpg)"-->
        <Header />
    </section>


    <div class="bg-stone-50 dark:bg-stone-900">
        <section class="dark:bg-black bg-local bg-cover" style="background-image: url(b-m6.jpg)">
            <div class="relative max-w-5xl mx-auto pt-20 sm:pt-24 lg:pt-32 pb-8 sm-pb-16">
                <h1
                    class="px-8 sm:px-20 text-slate-900 font-extrabold text-4xl sm:text-5xl lg:text-6xl tracking-tight text-center dark:text-white">
                    Get the chaos under control.<br> Organize your life.
                </h1>
                <h2 class="px-2 sm:px-10 mt-6 text-xl sm:text-2xl text-slate-600 dark:text-slate-200 text-center max-w-5xl mx-2 ">
                    A simple task management tool that even the busiest will love.
                </h2>
                
                <div class="flex flex-row justify-center mt-4">
                    <a href={$signUpHRef} use:link
                        class=" h-10 sm:h-12 px-6 pt-3 sm:pt-2.5 justify-center
                                bg-slate-900 hover:bg-slate-700/ focus:outline-none focus:ring-2 focus:ring-slate-400
                                focus:ring-offset-2 focus:ring-offset-slate-50 text-white text-xs sm:text-base whitespace-nowrap font-semibold rounded-lg
                                dark:bg-indigo-600 dark:highlight-white/20 dark:hover:bg-indigo-400">
                    Get Started
                    </a>
                </div>
            </div>
        </section>

        <section class="bg-local bg-cover py-8 px-4 mx-auto max-w-screen-xl lg:px-6 relative">
            <img src="/landing/octopus-screen-md.png" alt="octopus-screen-lg" 
                    class="hidden sm:block rounded-xl shadow-lg "/>

            <img src="/landing/octopus-screen-sm.png" alt="octopus-screen-sm"
                    class="rounded-xl shadow-lg hidden sm:block sm:absolute sm:right-[0px] sm:top-[200px]" />

            <img src="/landing/octopus-kanban-sm.png" alt="octopus-screen-sm"
                    class="rounded-xl shadow-lg block sm:hidden absolute right-[0px] top-[100px]" />

            <img src="/landing/octopus-screen-sm.png" alt="octopus-screen-lg" 
                    class="block sm:hidden rounded-xl shadow-lg "/>
        </section>

        <section class="bg-local bg-cover mt-20" >
            <div class="mx-auto py-8 px-4 max-w-screen-xl sm:py-16 lg:px-6">
                <div class="flex flex-col sm:flex-row justify-center gap-6 md:gap-12 text-lg font-normal">
                    <div>
                        <ul class="text-gray-500 dark:text-gray-400">
                            <li>Minimalist design</li>
                            <li>Convenient kanban boards </li>
                            <li>Intuitive interface</li>
                            <li>Pinned tags for tasks</li>
                        </ul>
                    </div>

                    <div>
                        <ul class="text-gray-500 dark:text-gray-400 ">
                            <li>Work with the whole team</li>
                            <li>As many lists as you need</li>
                            <li>Task steps</li>
                            <li>Formatable descriptions</li>
                        </ul>
                    </div>
                </div>

            </div>
        </section>

        <div class="relative max-w-5xl mx-auto">
            <h2 class="mx-2 text-center text-4xl font-extrabold text-gray-900 dark:text-white">
                Register for free and get started!
            </h2>
            <p class="text-center mx-2 mb-4 font-light text-gray-500 sm:text-lg dark:text-gray-400">
                Don't wait any longer to organize your work
            </p>
        
            <div class="flex flex-row justify-center mt-4">
                <a href={$signUpHRef} use:link
                    class=" h-10 sm:h-12 px-6 pt-3 sm:pt-2.5 justify-center
                            bg-slate-900 hover:bg-slate-700/ focus:outline-none focus:ring-2 focus:ring-slate-400
                            focus:ring-offset-2 focus:ring-offset-slate-50 text-white text-xs sm:text-base whitespace-nowrap font-semibold rounded-lg
                            dark:bg-indigo-600 dark:highlight-white/20 dark:hover:bg-indigo-400">
                Get Started
                </a>
            </div>
        </div>

        <section class="bg-local bg-cover mt-20"> <!-- style="background-image: url(b-sv1.jpg)" -->
            <Footer />
        </section>
    </div>
</div>

<style>
    li::before {
        content: "☑️";
        padding-inline: 1ch;
        margin-inline-end: 1ch;
    }
</style>