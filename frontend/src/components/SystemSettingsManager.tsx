// ... existing code ...
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="futepediaUrl">URL da Futepédia</Label>
            <Input
              id="futepediaUrl"
              name="futepediaUrl"
              value={settings.futepediaUrl || ''}
              onChange={handleInputChange}
              placeholder="Ex: https://futepedia.com.br"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="futepediaApiKey">Chave da API da Futepédia</Label>
            <Input
              id="futepediaApiKey"
              name="futepediaApiKey"
              value={settings.futepediaApiKey || ''}
              onChange={handleInputChange}
              placeholder="Ex: 1234567890abcdef1234567890abcdef"
            />
          </div>
        </div>
