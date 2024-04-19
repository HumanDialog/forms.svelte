<script>
	import { tick } from 'svelte';
	import {
		Page,
		Kanban,
		KanbanColumn,
		KanbanTitle,
		KanbanSummary,
		Spinner,
		DatePicker,
		Combo,
		ComboSource,
		KanbanCallbacks,
		KanbanColumnTop,
		KanbanColumnBottom,
        Tags
	} from '$lib';
	import { list, global_tags } from './board.data.js';
	import { reef } from '@humandialog/auth.svelte';

	let currentList = null;
	let columnData = [];
	let refreshToken = 1;

	let users = [];

	$: onParamsChanged();
	async function onParamsChanged(...args) {
		if (users.length == 0) {
			const res = await reef.get('/app/Users?fields=$ref,Name');
			if (res) users = res.User;
		}

		await tick(); // instead of await reef.get
		currentList = list;
		columnData[0] = currentList.allTasks.filter((t) => t.Phase == 1);
		columnData[1] = currentList.allTasks.filter((t) => t.Phase == 2);
		columnData[2] = currentList.allTasks.filter((t) => t.Phase == 3);
	}

	let pageOperations = [];

	function onTitleChanged(text, item) {
		item.title = text;
		console.log('on title changed:', text);
	}

	function onDateChanged(value, item) {
		if (!value) item.DueDate = '';
		else item.DueDate = value.toJSON();
	}

	function onResponsibleChanged(key, name, item) {
		item.Responsible = {
			$ref: key,
			Name: name
		};
	}

	function onUp(item) {
        const columnIdx = kanban.getColumnIdx(item)

		let list = columnData[columnIdx];
		let itemIdx = list.findIndex((e) => e == item);
		if (itemIdx > 0) {
			let tmp = list[itemIdx];
			list[itemIdx] = list[itemIdx - 1];
			list[itemIdx - 1] = tmp;

			refreshToken = refreshToken + 1;
		}
	}

	function onDown(item) {
        const columnIdx = kanban.getColumnIdx(item)

		let list = columnData[columnIdx];
		let itemIdx = list.findIndex((e) => e == item);
		if (itemIdx >= 0 && itemIdx < list.length - 1) {
			let tmp = list[itemIdx];
			list[itemIdx] = list[itemIdx + 1];
			list[itemIdx + 1] = tmp;

			refreshToken = refreshToken + 1;
		}
	}

	function onAdd(title, columnIdx, afterElement) 
    {
        let list = columnData[columnIdx];
        
        let newItem = {
            Id: columnIdx*100 + list.length,
            title: title,

        }

        if(afterElement === KanbanColumnTop)
        {
            list.splice(0, 0, newItem);
        }
        else if(afterElement === KanbanColumnBottom)
        {
            list.splice(list.length, 0, newItem);
        }
        else
        {
            let afterElementIdx = list.findIndex((e) => e == afterElement);
            list.splice(afterElementIdx + 1, 0, newItem);
        }

        return newItem;
	}

	function onRemove(item) {
        const columnIdx = kanban.getColumnIdx(item)
		let list = columnData[columnIdx];
        let itemIdx = list.findIndex((e) => e == item);
        list.splice(itemIdx, 1)
        refreshToken = refreshToken + 1;
	}

	 function onReplace(item, toColumnIdx, afterElement) {
        const fromColumnIdx = kanban.getColumnIdx(item)
		let fromList = columnData[fromColumnIdx];
		let toList = columnData[toColumnIdx];

		let fromItemIdx = fromList.findIndex((e) => e == item);
		if (fromItemIdx >= 0) {
			fromList.splice(fromItemIdx, 1);
			// todo: item.Phase = toColumnIdx + 1

            if(afterElement === KanbanColumnTop)
            {
                toList.splice(0, 0, item);
            }
            else if(afterElement === KanbanColumnBottom)
            {
                toList.splice(toList.length, 0, item);
            }
            else
            {
                let afterElementIdx = toList.findIndex((e) => e == afterElement);
                toList.splice(afterElementIdx + 1, 0, item);
            }

			refreshToken = refreshToken + 1;
		}
	}

    function onOpen(item)
    {
        console.log('open task', item)
    }

	let dueDatePlaceholder = false;
	let responsiblePlaceholder = false;

	let kanban;
</script>

{#if currentList && refreshToken > 0}
	<Page
		self={currentList}
		cl="!bg-white dark:!bg-stone-900 w-full h-full flex flex-col overflow-y-auto overflow-x-hidden py-1 px-1 border-0"
		toolbarOperations={pageOperations}
		clearsContext="props sel"
		title={currentList.Name}
	>
		<Kanban class="grow-0" self={currentList} bind:this={kanban}>
			<KanbanColumn title="Nadchodzące" objects={columnData[0]} />
			<KanbanColumn title="Wykonywane" objects={columnData[1]} />
			<KanbanColumn title="Do przemyślenia" objects={columnData[2]} />

			<KanbanCallbacks {onUp} {onDown} {onAdd} {onRemove} {onReplace} {onOpen}/>

			<KanbanTitle a="title" onChange={(text, item) => onTitleChanged(text, item)} />
			<KanbanSummary a="summary" />

			<!--   ================== kanbanCardTopProps ================== -->
			<svelte:fragment slot="kanbanCardTopProps" let:element={item}>
				{#if item.index}
                    <p
                        class="     h-6
                                    sm:text-xs sm:min-h-[1rem]
                                    text-base min-h-[1.5rem]
                                    text-stone-400
                                    text-right">
                        {item.index}
                    </p>
                {/if}

				{#if item.DueDate || dueDatePlaceholder}
					<DatePicker
						self={item}
						a="DueDate"
						compact={true}
						s="xs"
						inContext="props"
						changed={(value) => {
							onDateChanged(value, item);
						}}
						bind:this={dueDate}
					/>
				{/if}
			</svelte:fragment>

			<!--   ================== kanbanCardMiddleProps ================== -->
			<section slot="kanbanCardMiddleProps" let:element={item} class="grow-0">
				{#if item.Responsible || responsiblePlaceholder}
					<Combo
						compact={true}
						inContext="props"
						self={item}
						a="Responsible"
						isAssociation
						icon={false}
						changed={(key, name) => {
							onResponsibleChanged(key, name, item);
						}}
						s="xs"
						bind:this={responsible}
					>
						<ComboSource objects={users} key="$ref" name="Name" />
					</Combo>
				{/if}
			</section>

			<!--   ================== kanbanCardBottomProps ================== -->
            <svelte:fragment slot="kanbanCardBottomProps" let:element={item}>
                {#if item.tags}
                    <Tags
                        class="mt-2"
                        tags={item.tags}
                        globalTags={global_tags}
                        s="xs"
                    />
                {/if}
            </svelte:fragment>
			
		</Kanban>
	</Page>
{:else}
	<Spinner delay={3000} />
{/if}
