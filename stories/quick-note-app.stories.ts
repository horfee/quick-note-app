import { html, TemplateResult } from 'lit';
import '../src/quick-note-app.js';

export default {
  title: 'QuickNoteApp',
  component: 'quick-note-app',
  argTypes: {
    backgroundColor: { control: 'color' },
  },
};

interface Story<T> {
  (args: T): TemplateResult;
  args?: Partial<T>;
  argTypes?: Record<string, unknown>;
}

interface ArgTypes {
  title?: string;
  backgroundColor?: string;
}

const Template: Story<ArgTypes> = ({ title, backgroundColor = 'white' }: ArgTypes) => html`
  <quick-note-app style="--quick-note-app-background-color: ${backgroundColor}" .title=${title}></quick-note-app>
`;

export const App = Template.bind({});
App.args = {
  title: 'My app',
};
