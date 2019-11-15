export interface RenderAttributeTableProps {
    [key: string]: any;
}
export const AttributeTable = (props: RenderAttributeTableProps) => {
    const keys = Object.keys(props);
    if (keys.length === 0) {
        return <div id="attribute-panel" />;
    }
    return (
        <div id="attribute-panel">
            <h3>Entity properties</h3>
            <table>
                <thead>
                    <tr>
                        <th>Property</th>
                        <th>Value</th>
                    </tr>
                </thead>
                <tbody>
                    {keys.map(k => (
                        <tr>
                            <td>{k}</td>
                            <td>{props[k]}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
