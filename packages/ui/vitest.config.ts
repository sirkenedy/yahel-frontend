import react from '@vitejs/plugin-react';
import { mergeConfig } from 'vitest/config';
import { domProject } from '../../vitest.shared.ts';

export default mergeConfig(domProject('../../vitest.setup.ts'), { plugins: [react()] });
