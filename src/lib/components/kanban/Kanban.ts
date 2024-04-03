
export class rKanban_column
{
    public  id:         number;
    public  title:      string = '';
    public  width:      string = 'w-[240px]';
    public  self:       object|undefined = undefined;
    public  a:          string = '';
    public  objects:    object[]|undefined = undefined;
    public  context:    string = ''

}

export class rKanban_definition
{
    public  columns:    rKanban_column[] = [];
    public  titleAttrib: string = '';
    public  titleOnChange: Function | undefined = undefined;
    public  summaryAttrib: string = '';

    public  onUp: Function | undefined = undefined;
    public  onDown: Function | undefined = undefined;
    public  onAdd: Function | undefined = undefined;
    public  onRemove: Function | undefined = undefined;
    public  onReplace: Function | undefined = undefined;
    public  onOpen: Function | undefined = undefined;
}

export const KanbanColumnTop = -1
export const KanbanColumnBottom = -2