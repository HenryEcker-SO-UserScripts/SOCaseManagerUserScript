export function configureCharCounter(jTextarea: JQuery<HTMLTextAreaElement>, populateText: string, bounds: {
    min: number;
    max: number;
}) {
    jTextarea
        .val(populateText)
        .charCounter({
            ...bounds,
            target: jTextarea.parent().find('span.text-counter')
        })
        .trigger('charCounterUpdate');
}