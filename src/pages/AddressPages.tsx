import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Plus, Edit2, Trash2, Check } from 'lucide-react';
import { supabase, Address } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export function AddressesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [saving, setSaving] = useState(false);

  const defaultFormData = {
    label: 'Casa',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: 'São Paulo',
    state: 'SP',
    postal_code: '',
    is_default: false,
  };

  const [formData, setFormData] = useState(defaultFormData);

  useEffect(() => {
    if (user) {
      loadAddresses();
    }
  }, [user]);

  const loadAddresses = async () => {
    const { data } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user!.id)
      .order('is_default', { ascending: false });

    if (data) setAddresses(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (formData.is_default) {
        await supabase.from('addresses').update({ is_default: false }).eq('user_id', user!.id);
      }

      if (editingAddress) {
        await supabase.from('addresses').update(formData).eq('id', editingAddress.id);
      } else {
        await supabase.from('addresses').insert({ ...formData, user_id: user!.id });
      }

      await loadAddresses();
      setShowForm(false);
      setEditingAddress(null);
      setFormData(defaultFormData);
    } catch (error) {
      console.error('Error saving address:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este endereço?')) return;
    await supabase.from('addresses').delete().eq('id', id);
    await loadAddresses();
  };

  const handleSetDefault = async (id: string) => {
    await supabase.from('addresses').update({ is_default: false }).eq('user_id', user!.id);
    await supabase.from('addresses').update({ is_default: true }).eq('id', id);
    await loadAddresses();
  };

  const startEdit = (address: Address) => {
    setEditingAddress(address);
    setFormData({
      label: address.label,
      street: address.street,
      number: address.number || '',
      complement: address.complement || '',
      neighborhood: address.neighborhood,
      city: address.city,
      state: address.state,
      postal_code: address.postal_code || '',
      is_default: address.is_default,
    });
    setShowForm(true);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <MapPin className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Faça login para gerenciar endereços</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Meus Endereços</h1>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-5 h-5 mr-2" />
            Novo endereço
          </Button>
        </div>

        {showForm && (
          <Card className="mb-6">
            <CardBody>
              <h2 className="text-xl font-bold mb-4">
                {editingAddress ? 'Editar endereço' : 'Novo endereço'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Apelido"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    placeholder="Casa, Trabalho..."
                    required
                  />
                  <Input
                    label="CEP"
                    value={formData.postal_code}
                    onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                    placeholder="00000-000"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <Input
                      label="Rua"
                      value={formData.street}
                      onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                      placeholder="Nome da rua"
                      required
                    />
                  </div>
                  <Input
                    label="Número"
                    value={formData.number}
                    onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                    placeholder="123"
                  />
                </div>

                <Input
                  label="Complemento"
                  value={formData.complement}
                  onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
                  placeholder="Apto 101, Bloco B..."
                />

                <div className="grid grid-cols-3 gap-4">
                  <Input
                    label="Bairro"
                    value={formData.neighborhood}
                    onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                    placeholder="Bairro"
                    required
                  />
                  <Input
                    label="Cidade"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Cidade"
                    required
                  />
                  <Input
                    label="Estado"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="SP"
                    required
                  />
                </div>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_default}
                    onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                    className="w-4 h-4 text-red-500 rounded focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700">Definir como endereço padrão</span>
                </label>

                <div className="flex space-x-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setShowForm(false);
                      setEditingAddress(null);
                      setFormData(defaultFormData);
                    }}
                    fullWidth
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" loading={saving} fullWidth>
                    {editingAddress ? 'Atualizar' : 'Salvar'}
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse flex flex-col items-center space-y-4">
              <div className="w-16 h-16 bg-gray-300 rounded-2xl"></div>
              <div className="h-4 w-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        ) : addresses.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum endereço cadastrado</h3>
            <p className="text-gray-600 mb-4">Adicione um endereço para receber seus pedidos</p>
            <Button onClick={() => setShowForm(true)}>Adicionar endereço</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {addresses.map((address) => (
              <Card key={address.id}>
                <CardBody>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          address.is_default ? 'bg-red-100' : 'bg-gray-100'
                        }`}
                      >
                        <MapPin className={`w-5 h-5 ${address.is_default ? 'text-red-500' : 'text-gray-400'}`} />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-gray-900">{address.label}</h3>
                          {address.is_default && (
                            <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded-full">
                              Padrão
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {address.street}
                          {address.number && `, ${address.number}`}
                          {address.complement && ` - ${address.complement}`}
                        </p>
                        <p className="text-sm text-gray-600">
                          {address.neighborhood}, {address.city} - {address.state}
                        </p>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      {!address.is_default && (
                        <button
                          onClick={() => handleSetDefault(address.id)}
                          className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200"
                          title="Definir como padrão"
                        >
                          <Check className="w-4 h-4 text-gray-600" />
                        </button>
                      )}
                      <button
                        onClick={() => startEdit(address)}
                        className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200"
                      >
                        <Edit2 className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(address.id)}
                        className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
