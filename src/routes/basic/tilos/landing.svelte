<script>
	import Header from './header.svelte'
    import Footer  from './footer.svelte';
    import {link} from 'svelte-spa-router'
	
</script>

<svelte:head>
  <title>Tilos | Linear scheduling software.</title>
  <link rel="canonical" href="https://tilos.objectreef.dev"/>
</svelte:head> 

<div class="min-h-screen h-screen overflow-x-hidden">

    <section class="bg-local bg-cover bg-stone-900" > <!-- style="background-image: url(b-sv1.jpg)"-->
        <Header main/>
    </section>


    <div class="bg-stone-50 dark:bg-stone-900 mx-4">
        <section class="w-full  flex justify-center">
            <section class="max-w-5xl ">
            <article class=" prose prose-lg prose-zinc dark:prose-invert !max-w-none">
        
                <section class="dark:bg-black bg-local bg-cover">
                    <div class="">
                        <h1 class="text-center text-7xl mt-10 sm:mt-20">
                            Tilos
                        </h1>
                        <p class="lead text-center">
                            A robust scheduling software for infrastructure projects that combines time and distance into one graphical view, giving you more power to keep your projects on schedule and keep everyone on track.
                        </p>
                        
                        <div class="not-prose flex flex-row justify-center mt-4">
                            <a href="/tdownload" use:link
                                class=" h-10 sm:h-12 px-6 pt-3 sm:pt-2.5 justify-center
                                        bg-slate-900 hover:bg-slate-700/ focus:outline-none focus:ring-2 focus:ring-slate-400
                                        focus:ring-offset-2 focus:ring-offset-slate-50 text-white text-xs sm:text-base whitespace-nowrap font-semibold rounded-lg
                                        dark:bg-indigo-600 dark:highlight-white/20 dark:hover:bg-indigo-400">
                            Download
                            </a>
                        </div>
                    
                    </div>
                </section>

                <section class="bg-local bg-cover">
                    <img src="tilos/Tilos-monitor-1200x900_0.webp" alt="octopus-screen-lg" 
                            class=""/>
                </section>

         
                <div class="mx-4">
                    <h2 class="text-center">
                        Stay on schedule with Tilos linear planning
                    </h2>
                    <p class="text-center">
                        Linear projects are complex. Contact us to see how Tilos removes the challenges and allows you to be in control of the status of your construction project with a simplified, visual look at your schedule and plan.
                    </p>
                
                    <div class="not-prose flex flex-row justify-center mt-4">
                        <a href="/tcontact" use:link
                            class=" h-10 sm:h-12 px-6 pt-3 sm:pt-2.5 justify-center
                                    bg-slate-900 hover:bg-slate-700/ focus:outline-none focus:ring-2 focus:ring-slate-400
                                    focus:ring-offset-2 focus:ring-offset-slate-50 text-white text-xs sm:text-base whitespace-nowrap font-semibold rounded-lg
                                    dark:bg-indigo-600 dark:highlight-white/20 dark:hover:bg-indigo-400">
                        Contact Us
                        </a>
                    </div>
                </div>

        
                <section class="bg-local bg-cover mt-20" >
                    <div class="">
                        <h2 class="text-center">
                            Have all the scheduling information you need in one place</h2>
                        <p class="text-center">
                            Trimble Tilos accommodates the nuances of having equipment and resources spread across a large area in civil construction. Run project simulations by connecting a schedule and a map of your project, then easily compare to make the best planning decisions.</p>
                        
                        <div class="flex flex-col sm:flex-row flex-wrap justify-center gap-6 md:gap-12">
                            <div class="flex-none w-96">
                                <h3 class="">
                                    Schedule optimization</h3>
                                <img loading="lazy" src="tilos/trimble-construction-software-project-scheduling-Scenario-optimization.avif" 
                                        alt="construction-product-tilos-features-design-image"/>

                                <ul class="">
                                    <li><p>Use time-distance diagrams to map out a linear schedule</p></li>
                                    <li>Support “what if” scenarios within the scheduling overview</li>
                                    <li>See equipment, materials, costs, timelines and budgets in one Gantt chart</li>
                                    <li>Reduce risk and planning mistakes with time chainage</li>
                                </ul>
                            </div>

                            <div class="flex-none w-96">
                                <h3 class="">
                                    Visualization</h3>
                                <img loading="lazy" src="tilos/trimble-construction-software-project-sceduling-Schedule-visualization.avif" 
                                        alt="construction-product-tilos-features-design-image"/>

                                <ul class="">
                                    <li>Link activities to save time</li>
                                    <li>Gantt charts grouped by location and by company</li>
                                    <li>Combines Gantt schedules, construction site plans, heights, earth mass handling, scales, histograms all in one view</li>
                                    <li>Print your schedules with the level of detail intact using PDF and SVG files</li>
                                    <li>Annotate images with comments</li>
                                </ul>
                            </div>

                            <div class="flex-none w-96">
                                <h3 class="">
                                    Project monitoring</h3>
                                <img loading="lazy" src="tilos/trimble-construction-software-project-sceduling-monitor-progress.avif" 
                                        alt="construction-product-tilos-features-design-image"/>

                                <ul class="">
                                    <li>Detect conflicts utilizing project management tools alongside your schedule</li>
                                    <li>Detailed overview of work progress and percent of project completed</li>
                                    <li>Location-based progress tracking shown in time and distance</li>
                                    <li>See if your project is either on time, ahead of schedule or with delays</li>
                                    
                                </ul>
                            </div>

                            <div class="flex-none w-96">
                                <h3 class="">
                                    Optimized earthmoving</h3>
                                <img loading="lazy" src="tilos/trimble-construction-software-project-sceduling-Optimal-mass-handling.avif" 
                                        alt="construction-product-tilos-features-design-image"/>

                                <ul class="">
                                    <li>Easily see a visual of where to cut and fill soil masses on your projects</li>
                                    <li>Always know where your resources are and how they’re being utilized</li>
                                    <li>Coordinate the movement of material with time chainage</li>
                                </ul>
                            </div>

                        </div>

                    </div>
                </section>

                 <h2 class="text-center">
                    Want to learn what Tilos can do for you?
                </h2>
                <p class="text-center">
                    No matter your role or stage in the construction project lifecycle, we can help you be more productive. Speak to one of our software experts today.
                </p>
                <div class="not-prose flex flex-row justify-center mt-4">
                    <a href="/tcontact" use:link
                        class=" h-10 sm:h-12 px-6 pt-3 sm:pt-2.5 justify-center
                                bg-slate-900 hover:bg-slate-700/ focus:outline-none focus:ring-2 focus:ring-slate-400
                                focus:ring-offset-2 focus:ring-offset-slate-50 text-white text-xs sm:text-base whitespace-nowrap font-semibold rounded-lg
                                dark:bg-indigo-600 dark:highlight-white/20 dark:hover:bg-indigo-400">
                    Contact Us
                    </a>
                </div>
                
                <h2 class="text-center">Help for Tilos users</h2>
                <p class="text-center">Take a look through our <a href="/thome" use:link>support</a> options linked below.</p>
                
            </article>
            </section>
        </section>

        

        <section class="bg-local bg-cover mt-20"> <!-- style="background-image: url(b-sv1.jpg)" -->
            <Footer />
        </section>
    </div>
</div>

