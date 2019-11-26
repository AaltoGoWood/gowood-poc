import { AttributesLayout } from '../../interfaces';

export interface RenderAttributeTableProps {
    [key: string]: any;
}
export const AttributeTable = (
    props: RenderAttributeTableProps,
    layout: AttributesLayout
) => {
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
                    {keys
                        .filter(k => layout.shouldShowField(k))
                        .map(k => (
                            <tr className={layout.attributeTagFn(k)}>
                                <td className="field">{k}</td>
                                <td className="value">{props[k]}</td>
                            </tr>
                        ))}
                </tbody>
            </table>
        </div>
    );
};
