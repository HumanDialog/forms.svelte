<script>
    import {reef, session} from '@humandialog/auth.svelte'
    import {    mainContentPageReloader} from '$lib'
    import {link} from 'svelte-spa-router'
	
    export let params = {}

    let user = null;
    
    $: onParamsChanged($session, $mainContentPageReloader);
    
    async function onParamsChanged(...args)
    {
        if(!$session.isActive)
        {
            user = null;
            return;
        }

        
        await fetchData()
    }

    async function fetchData()
    {
        let res = await reef.post(`/user/query`,
                                {
                                    Id: 1,
                                    Tree:
                                    [
                                        {
                                            Id: 1,
                                            Association: '',
                                            Expressions:['Id','login'],
                                            SubTree:
                                            [
                                                {
                                                    Id: 2,
                                                    Association: 'Reservations',
                                                    Sort: "-ReservationDate",
                                                    SubTree:[
                                                        {
                                                            Id: 3,
                                                            Association: 'Room',
                                                            Expressions:['$ref', 'Name'],
                                                            SubTree:[
                                                                {
                                                                    Id: 4,
                                                                    Association: 'Hotel',
                                                                    Expressions:['$ref', 'Name', 'City'],
                                                                }
                                                            ]
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    ]   
                                });
        if(res)
            user = res.User;
        else
            user = null
    }

    async function cancelReservation(reservation) 
    {
        const result = await reef.post(`${reservation.$ref}/Cancel`)
        await fetchData();
    }

    function printDatesRange(startDate, endDate)
    {
        const sd = new Date(startDate);
        const ed = new Date(endDate);
        return `${sd.toDateString()} - ${ed.toDateString()}`
    }

</script>

<a href="/" use:link class="underline text-sm font-semibold ml-5">&larr; Back to main page</a>

<div class="flex flex-col justify-center items-center">
    <h1 class="mt-20 text-4xl font-extrabold dark:text-white mb-4 text-center">My reservations</h1>

    {#if user && user.Reservations && user.Reservations.length > 0}
    <table class="w-full max-w-screen-lg text-sm text-left rtl:text-right text-stone-500 dark:text-stone-400">
        <thead class="text-xs text-stone-700 uppercase bg-stone-50 dark:bg-stone-700 dark:text-stone-400">
            <tr>
                <th scope="col" class="px-6 py-3">
                    Hotel
                </th>
                <th scope="col" class="px-6 py-3">
                    City
                </th>
                <th scope="col" class="px-6 py-3">
                    Room
                </th>
                <th scope="col" class="px-6 py-3">
                    Dates
                </th>
                <th scope="col" class="px-6 py-3">
                    
                </th>
            </tr>
        </thead>
        <tbody>
            {#each user.Reservations as reservation (reservation.$ref)}
                <tr class="odd:bg-white odd:dark:bg-stone-900 even:bg-stone-50 even:dark:bg-stone-800 border-b dark:border-stone-700">
                    <th scope="row" class="px-6 py-4 font-medium text-stone-900 whitespace-nowrap dark:text-white">
                        {reservation.Room.Hotel.Name}
                    </th>
                    <td class="px-6 py-4">
                        {reservation.Room.Hotel.City}
                    <td class="px-6 py-4">
                        {reservation.Room.Name}
                    </td>
                    <td class="px-6 py-4">
                        {printDatesRange(reservation.CheckInDate, reservation.CheckOutDate)}
                    </td>
                    <td class="px-6 py-4">
                        <button type="button" on:click={() => cancelReservation(reservation)} 
                                            class="text-stone-900 bg-white border border-stone-300 hover:bg-stone-100 font-medium rounded-full 
                                                    text-xs px-5 py-2.5 me-2 mb-2 dark:bg-stone-800 dark:text-white dark:border-stone-600 dark:hover:bg-stone-700 
                                                    dark:hover:border-stone-600">
                            Cancel
                        </button>
                    </td>
                </tr>
            {/each}
        </tbody>
    </table>
    {/if}
</div>