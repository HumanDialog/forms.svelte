
export class rKanban_column
{
    public  id:         number;
    public  title:      string = '';
    public  width:      string = 'w-[240px]';
    public  state:      any = ''

}

export class rKanban_definition
{
    public  columns:    rKanban_column[] = [];
    public  titleAttrib: string = '';
    public  titleOnChange: Function | undefined = undefined;
    public  titleReadOnly: boolean = false;
    public  summaryAttrib: string = '';
    public  summaryOnChange: Function | undefined = undefined;
    public  summaryReadOnly: boolean = false;

    public  self:       object|undefined = undefined;
    public  a:          string = '';
    public  objects:    object[]|undefined = undefined;
    public  context:    string = ''
    public  key:        string = ''
    public  typename:   string = ''

    public  stateAttrib: string = '';
    public  orderAttrib: string = ''

    public  onUp: Function | undefined = undefined;
    public  onDown: Function | undefined = undefined;
    public  onAdd: Function | undefined = undefined;
    public  onRemove: Function | undefined = undefined;
    public  onReplace: Function | undefined = undefined;
    public  onOpen: Function | undefined = undefined;

    private  items: object[] | null = null;
    public   getItems() : object[]
    {
        if(this.items == null)
        {
            let item = this.self;
            this.items = null;

            if(this.objects)
                this.items = this.objects;
            else if(item && this.a )
                this.items = item[this.a];

            if(this.items == null)
                this.items = [];
        }
        return this.items;
    }

}

export const KanbanColumnTop = -1
export const KanbanColumnBottom = -2