
export class Document_command
{
    public caption      :string;
    public description  :string;
    public tags?        :string;
    public shortcut?    :string;
    public icon;
    public icon_size?   :number = 6;
    public on_choice;
    public is_active;
    public is_visible;
    public separator?   :boolean = false
}