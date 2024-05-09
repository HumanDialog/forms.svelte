import {rCombo_definition} from '../combo/combo'

export enum rList_property_type
{
    Hidden,
    Text,
    Date,
    Combo,
    Static,
    Tags
}

export class rList_property
{
    constructor(type :rList_property_type)
    {
        this.type = type;
    }

    public type         :rList_property_type = rList_property_type.Hidden;
    public name         :string = '';
    public a            :string = '';
    public onSelect    :Function | undefined = undefined;
    public position     :number|string|undefined = undefined
}

export class rList_property_combo extends rList_property
{
    constructor()
    {
        super(rList_property_type.Combo);
        this.combo_definition = new rCombo_definition;
    }

    public association      :boolean = false;
    public combo_definition :rCombo_definition;
}

export class rList_property_tags extends rList_property
{
    constructor()
    {
        super(rList_property_type.Tags);
    }

    public canChangeColor: boolean = false;
    public getAllTags: Function | undefined = undefined;
    public onUpdateAllTags: Function | undefined = undefined;
}

export class rList_definition
{
    public title                :string = '';
    public title_editable       :boolean = false;
    public on_title_changed     :Function | undefined = undefined;
    public title_readonly       :boolean = false;
    public title_href           :string | undefined = undefined
    public title_href_func      :Function | undefined = undefined;

    public summary              :string = '';
    public summary_editable     :boolean = false;
    public on_summary_changed   :Function | undefined = undefined;
    public summary_readonly     :boolean = false;

    public can_insert           :boolean = false;
    public onInsert             :Function | undefined = undefined;
    public inserter_icon        :boolean = false;
    public onOpen               :Function | undefined = undefined;

    public properties           :rList_property[] = [];
}