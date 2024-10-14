<script>
	import Modal from "$lib/modal.svelte";
	import { reef } from "@humandialog/auth.svelte";
	import { push } from "svelte-spa-router";


    export let hotels = []
    export let settings;

    let user_class = $$props.class ?? '' 
    let modalSuccess;
    let modalError;

    async function makeReservation(room)
    {
        const result = await reef.post(`${room.$ref}/MakeReserveation`,
                                {
                                    startDate: settings.checkInDate,
                                    endDate: settings.checkOutDate
                                }
                            )
        if(!result)
            modalError.show();              
        else
        {
            console.log(result)
            const reservation = result.Reservation;
            if(reservation)
                modalSuccess.show();
            else
                modalError.show();
        }
    }
</script>

<div class="{user_class}">
    <h2 class="text-2xl font-extrabold dark:text-white mb-4 text-center">Results</h2>
    <table class="w-full text-sm text-left rtl:text-right text-stone-500 dark:text-stone-400">
        {#each hotels as hotel (hotel.$ref)}
                <thead class="text-xs text-stone-700 uppercase bg-stone-50 dark:bg-stone-700 dark:text-stone-400">
                    <tr>
                        <th scope="col" class="px-6 py-3">
                            {hotel.Name}
                        </th>
                        <th scope="col" class="px-6 py-3">
                            Beds no
                        </th>
                        <th scope="col" class="px-6 py-3">
                            Price
                        </th>
                        <th scope="col" class="px-6 py-3">
                            
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {#each hotel.Rooms as room (room.$ref)}
                        <tr class="odd:bg-white odd:dark:bg-stone-900 even:bg-stone-50 even:dark:bg-stone-800 border-b dark:border-stone-700">
                            <th scope="row" class="px-6 py-4 font-medium text-stone-900 whitespace-nowrap dark:text-white">
                                {room.Name}
                            </th>
                            <td class="px-6 py-4">
                                {room.BedsNo}
                            </td>
                            <td class="px-6 py-4">
                                
                            </td>
                            <td class="px-6 py-4">
                                <button type="button" on:click={() => makeReservation(room)} 
                                                     class="text-stone-900 bg-white border border-stone-300 hover:bg-stone-100 font-medium rounded-full 
                                                            text-xs px-5 py-2.5 me-2 mb-2 dark:bg-stone-800 dark:text-white dark:border-stone-600 dark:hover:bg-stone-700 
                                                            dark:hover:border-stone-600">
                                    Book
                                </button>
                            </td>
                        </tr>
                    {/each}
                    
                </tbody>
            {/each}
        </table>
</div>

<Modal  title="Congratulations"
        mode={0}
        bind:this={modalSuccess}
        onOkCallback={() => { modalSuccess.hide(); push('/reservations')} }>
    <p>
        You have reserved a room.
        You will be redrected to your reservations list
    </p>
</Modal>

<Modal  title="Error"
        mode={2}
        bind:this={modalError}>
    <p>
        Something went wrong
    </p>
</Modal>