<script>
    import {reef} from '@humandialog/auth.svelte'
    import { onMount } from 'svelte';
    import {Combo, ComboSource, ComboItem, DatePicker} from '$lib'
    import FaSearch from 'svelte-icons/fa/FaSearch.svelte'
	import Results from './Results.svelte';
    import {link} from 'svelte-spa-router'
	

    let places = [];
    let settings = {
        place: null,
        radius: 5,
        geoRange: null,
        checkInDate: null,
        checkOutDate: null,
        people: 1
    }

    onMount( async () => {
        const res = await reef.get('app/Places?fields=$ref,Name,$type')
        if(res)
            places = res.Place

        return () => {}
    })

    async function onChooseCity(sett, navRef, cityName)
    {
        settings.place = places.find(p => p.$ref == navRef);
        await checkGeoRange()

    }

    async function onChooseRadius(sett, radius, name)
    {
        settings.radius = radius;
        await checkGeoRange()
    }

    async function checkGeoRange()
    {
        if(!settings.place)
            return;

        const geoRange = await reef.post('app/CalculateGeoRange', 
                                            {
                                                placeName: settings.place.Name,
                                                radiusKm: settings.radius
                                            }
                                        )
        if(geoRange)
            settings.geoRange = geoRange
        else
            settings.geoRange = null

        console.log(settings)
    }

    let checkoutDateElement;
    function onSelectCheckInDate(dt)
    {
        settings.checkInDate = dt ? dt.toISOString() : null

        if(settings.checkInDate)
        {
            let tmpDate = new Date(settings.checkInDate);
            if(settings.checkOutDate)
            {
                
            }
            else
            {
                tmpDate.setDate( tmpDate.getDate() + 1 )
                settings.checkOutDate = tmpDate.toISOString()
                checkoutDateElement.refresh();
            }
        }

        console.log(settings)
    }

    function onSelectCheckOutDate(dt)
    {
        settings.checkOutDate = dt ? dt.toISOString() : null
        console.log(settings)
    }

    function onChoosePeople(sett, people, name)
    {
        settings.people = people;
        console.log(settings)
    }

    function reefDate(isoDate)
    {
        const dt = new Date(isoDate)
        const year = dt.getFullYear()
        let month = '' + (dt.getMonth() + 1);
        if(month.length < 2)
            month = '0' + month;

        let day = '' + dt.getDate();
        if(day.length < 2)
            day = '0' + day;

        return `${year}.${month}.${day}`;
    }

    let results = []
    async function search()
    {
        const res = await reef.post('app/query',
                    {
                        Tree:[
                            {
                                Id: 1,
                                Association: 'Hotels',
                                Filter: `IsInGeoRange(${settings.geoRange.longitudeMin}, ${settings.geoRange.latitudeMin}, ${settings.geoRange.longitudeMax}, ${settings.geoRange.latitudeMax})`,
                                Sort: `CalcAproxDistance(${settings.geoRange.longitude}, ${settings.geoRange.latitude})`,
                                Expressions:['Name', '$ref'],
                                SubTree:[
                                    {
                                        Id: 2,
                                        Association: 'Rooms',
                                        Expressions: ["Name", "BedsNo", "$ref"],
                                        Filter: `BedsNo>=${settings.people} and isAvailable(${reefDate(settings.checkInDate)}, ${reefDate(settings.checkOutDate)})`,
                                        Sort: 'BedsNo'
                                    }
                                ]
                            }
                        ]
                    }
                );
        if(res)
            results = res.Hotel;
    }

</script>

<svelte:head>
    <title>Rooms</title>
</svelte:head>

<a href="/reservations" use:link class="underline text-sm font-semibold ml-5 absolute right-2">My Reservations &rarr;</a>

<div class="flex flex-col justify-center items-center">
    <h1 class="mt-20 text-4xl font-extrabold dark:text-white mb-4 text-center">Where do you want to go?</h1>

    <section class="mt-10 w-full max-w-screen-lg grid grid-cols-6 gap-5">
        {#if places.length > 0}
            
            <Combo  c="4" placeholder="Enter city name" onSelect={onChooseCity} s="md"  filtered  self={settings} a='place' label='Where?'>
                <ComboSource    objects={places} 
                                key="$ref"
                                name="Name"/>
            </Combo>

            <Combo  c="2" onSelect={onChooseRadius} s="md" self={settings} a='radius'  label='Neighborhood'>
                <ComboItem key={5} name='5 km'/>
                <ComboItem key={10} name='10 km'/>
                <ComboItem key={20} name='20 km'/>
            </Combo>

            <section class="col-span-4 flex flex-row">
                <p class="flex-none text-xs mt-4 mr-2">Dates range:</p>
                <DatePicker onSelect={onSelectCheckInDate} self={settings} a='checkInDate' c='' s='md' class="h-12"/>
            
                <p class="text-base mt-2 mx-2"> - </p>
                <DatePicker onSelect={onSelectCheckOutDate} self={settings} a='checkOutDate' c='' s='md' class="h-12" bind:this={checkoutDateElement}/>
            </section>
            
            <Combo  c="2" onSelect={onChoosePeople} s="md" self={settings} a='people'>
                <ComboItem key={1} name='1 person'/>
                <ComboItem key={2} name='2 people'/>
                <ComboItem key={3} name='3 people'/>
                <ComboItem key={4} name='4 people'/>
            </Combo>

            <button type="button" on:click={search}
                                    class="col-span-6 px-5 py-2.5  mb-2 
                                         focus:outline-none 
                                         text-white rounded-lg
                                         bg-green-700 hover:bg-green-800 
                                         font-medium  text-sm dark:bg-green-600 dark:hover:bg-green-700
                                         flex items-center justify-center">
                
                <div class="w-5 h-5">
                    <FaSearch/>
                </div>
                <p class="ml-3">
                    Search
                </p>
                
            </button>

        {:else}
            <p>Loading cities...</p>
        {/if}
    </section>


    {#if results && results.length} 
        <Results hotels={results} {settings} class="w-full max-w-screen-lg mt-20 mb-20"/>
    {/if} 
</div>


