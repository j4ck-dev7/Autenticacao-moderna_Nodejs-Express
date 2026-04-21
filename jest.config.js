export default {
    testEnvironment: 'node',
    testMatch: ['**/tests/**/*.js', '**/*.test.js'], // [0]: Pasta tests, [1]: Arquivos com sufixo .test.js
    bail: 1, // Interrompe após o primeiro teste falho
    transform: { }, // Padrão segunda a documentação para o ESM
    extensionsToTreatAsEsm: [], // Informa ao Jest que arquivos .js são módulos ESM, de acordo com o package.json mais próximo
}