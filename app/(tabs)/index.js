// App.js
// Versión con IA y diseño estético renovado.

import React, { useState, useEffect, createContext, useContext } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  Modal,
  ScrollView,
  ActivityIndicator,
  StatusBar, // Importado para controlar la barra de estado
} from 'react-native';

// Importaciones de librerías para Expo
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons as Icon } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import XLSX from 'xlsx';

// --- Definición de la paleta de colores para un look cohesivo ---
const COLORS = {
  primary: '#007AFF', // Un azul vibrante y moderno
  primary_light: '#EBF5FF',
  secondary: '#4CAF50', // Verde para acciones de éxito
  accent: '#FF9500', // Naranja para acentos y alertas
  danger: '#FF3B30', // Rojo para acciones destructivas
  background: '#F2F2F7', // Un gris muy claro y limpio para el fondo
  surface: '#FFFFFF', // Blanco para las tarjetas y superficies
  text_primary: '#1C1C1E', // Negro sutil para textos principales
  text_secondary: '#8A8A8E', // Gris para textos secundarios y detalles
  border: '#E5E5EA',
};


// -------------------------------------------------------------------
// 1. CONTEXTO GLOBAL (Sin cambios en la funcionalidad)
// -------------------------------------------------------------------
const AppContext = createContext();

const AppProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const storedProducts = await AsyncStorage.getItem('@products');
        const storedSales = await AsyncStorage.getItem('@sales');
        if (storedProducts) setProducts(JSON.parse(storedProducts));
        if (storedSales) setSales(JSON.parse(storedSales));
      } catch (e) {
        console.error("Error cargando datos", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      AsyncStorage.setItem('@products', JSON.stringify(products))
        .catch(e => console.error("Error guardando productos", e));
    }
  }, [products, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      AsyncStorage.setItem('@sales', JSON.stringify(sales))
        .catch(e => console.error("Error guardando ventas", e));
    }
  }, [sales, isLoading]);

  const addProduct = (product) => {
    setProducts(prev => [...prev, { ...product, id: Date.now().toString() }]);
  };
  
  const editProduct = (updatedProduct) => {
    setProducts(prev => 
      prev.map(p => p.id === updatedProduct.id ? updatedProduct : p)
    );
  };

  const updateStock = (productId, amount) => {
    setProducts(prev =>
      prev.map(p =>
        p.id === productId ? { ...p, stock: Math.max(0, p.stock + amount) } : p
      )
    );
  };

  const addSale = (sale) => {
    setSales(prev => [...prev, { ...sale, id: Date.now().toString() }]);
    sale.items.forEach(item => {
      updateStock(item.productId, -item.quantity);
    });
  };

  const deleteSale = (saleId) => {
    const saleToDelete = sales.find(s => s.id === saleId);
    if (saleToDelete) {
      saleToDelete.items.forEach(item => {
        updateStock(item.productId, item.quantity);
      });
      setSales(prev => prev.filter(s => s.id !== saleId));
    }
  };
  
  const deleteProduct = (productId) => {
    const isProductInSale = sales.some(sale => sale.items.some(item => item.productId === productId));
    if (isProductInSale) {
        Alert.alert("Error", "No se puede eliminar un producto que ya ha sido parte de una venta.");
        return;
    }
    setProducts(prev => prev.filter(p => p.id !== productId));
  };
  
  const clearSales = async () => {
    try {
      await AsyncStorage.removeItem('@sales');
      setSales([]);
    } catch (e) {
      console.error("Error borrando ventas", e);
    }
  };

  return (
    <AppContext.Provider value={{ products, sales, addProduct, editProduct, updateStock, addSale, deleteSale, deleteProduct, clearSales, isLoading }}>
      {children}
    </AppContext.Provider>
  );
};

const useApp = () => useContext(AppContext);

// -------------------------------------------------------------------
// 2. PANTALLAS DE LA APLICACIÓN (Con JSX actualizado para nuevos estilos)
// -------------------------------------------------------------------

// --- Pantalla Principal (Dashboard) ---
const HomeScreen = ({ navigation }) => {
  const { sales, isLoading } = useApp();

  if (isLoading) {
    return <View style={styles.container}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }

  const today = new Date().toISOString().split('T')[0];
  const todaySales = sales.filter(s => s.date.startsWith(today));

  const totalRevenue = todaySales.reduce((sum, s) => sum + s.total, 0);
  const totalProfit = todaySales.reduce((sum, s) => sum + s.profit, 0);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Resumen del Día</Text>
          <Text style={styles.headerSubtitle}>{new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
        </View>

        <View style={styles.summaryGrid}>
          <View style={styles.summaryBox}>
            <Icon name="cash-outline" size={32} color={COLORS.primary} />
            <Text style={styles.summaryLabel}>Ventas de Hoy</Text>
            <Text style={styles.summaryValue}>${totalRevenue.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryBox}>
            <Icon name="trending-up-outline" size={32} color={COLORS.secondary} />
            <Text style={styles.summaryLabel}>Ganancia de Hoy</Text>
            <Text style={styles.summaryValue}>${totalProfit.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.menuContainer}>
          <TouchableOpacity style={styles.menuButton} onPress={() => navigation.navigate('Nueva Venta')}>
            <Icon name="cart-outline" size={24} color={COLORS.surface} />
            <Text style={styles.menuButtonText}>Cargar Venta</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuButton} onPress={() => navigation.navigate('Inventario')}>
            <Icon name="list-outline" size={24} color={COLORS.surface} />
            <Text style={styles.menuButtonText}>Inventario</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuButton} onPress={() => navigation.navigate('Historial')}>
            <Icon name="time-outline" size={24} color={COLORS.surface} />
            <Text style={styles.menuButtonText}>Historial de Ventas</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// --- Pantalla de Inventario ---
const InventoryScreen = () => {
  const { products, addProduct, editProduct, deleteProduct } = useApp();
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', cost: '', price: '', stock: '' });
  const [editingProduct, setEditingProduct] = useState(null);

  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.cost || !newProduct.price || !newProduct.stock) {
      Alert.alert("Error", "Todos los campos son obligatorios.");
      return;
    }
    addProduct({
      name: newProduct.name,
      costPrice: parseFloat(newProduct.cost),
      sellingPrice: parseFloat(newProduct.price),
      stock: parseInt(newProduct.stock, 10),
    });
    setNewProduct({ name: '', cost: '', price: '', stock: '' });
    setModalVisible(false);
  };
  
  const handleEditProduct = () => {
    if (!editingProduct.name || !editingProduct.costPrice || !editingProduct.sellingPrice || editingProduct.stock === '') {
      Alert.alert("Error", "Todos los campos son obligatorios.");
      return;
    }
    editProduct({
      id: editingProduct.id,
      name: editingProduct.name,
      costPrice: parseFloat(editingProduct.costPrice),
      sellingPrice: parseFloat(editingProduct.sellingPrice),
      stock: parseInt(editingProduct.stock, 10),
    });
    setEditingProduct(null);
    setEditModalVisible(false);
  };

  const confirmDelete = (productId) => {
    Alert.alert("Confirmar Eliminación", "¿Estás seguro de que quieres eliminar este producto?",
      [{ text: "Cancelar", style: "cancel" }, { text: "Eliminar", onPress: () => deleteProduct(productId), style: "destructive" }]
    );
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.itemContainer} onPress={() => { setEditingProduct(item); setEditModalVisible(true); }}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemDetails}>Precio: ${item.sellingPrice.toFixed(2)} | Costo: ${item.costPrice.toFixed(2)}</Text>
      </View>
      <View style={styles.itemStockContainer}>
        <Text style={styles.itemStockText}>{item.stock}</Text>
        <Text style={styles.itemDetails}>en Stock</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={products}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16 }}
        ListEmptyComponent={<Text style={styles.emptyText}>No hay productos en el inventario.</Text>}
      />
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Icon name="add" size={30} color="#fff" />
      </TouchableOpacity>

      {/* Modal para agregar y editar producto (unificado para consistencia) */}
      <Modal animationType="slide" transparent={true} visible={modalVisible || editModalVisible}>
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</Text>
            
            <TextInput placeholder="Nombre del producto" style={styles.input} 
              value={editingProduct ? editingProduct.name : newProduct.name} 
              onChangeText={t => editingProduct ? setEditingProduct(p => ({...p, name: t})) : setNewProduct(p => ({...p, name: t}))} />
            
            <TextInput placeholder="Precio de costo" style={styles.input} keyboardType="numeric" 
              value={editingProduct ? String(editingProduct.costPrice) : newProduct.cost} 
              onChangeText={t => editingProduct ? setEditingProduct(p => ({...p, costPrice: t})) : setNewProduct(p => ({...p, cost: t}))} />
            
            <TextInput placeholder="Precio de venta" style={styles.input} keyboardType="numeric" 
              value={editingProduct ? String(editingProduct.sellingPrice) : newProduct.price} 
              onChangeText={t => editingProduct ? setEditingProduct(p => ({...p, sellingPrice: t})) : setNewProduct(p => ({...p, price: t}))} />
            
            <TextInput placeholder="Stock" style={styles.input} keyboardType="numeric" 
              value={editingProduct ? String(editingProduct.stock) : newProduct.stock} 
              onChangeText={t => editingProduct ? setEditingProduct(p => ({...p, stock: t})) : setNewProduct(p => ({...p, stock: t}))} />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.button, styles.buttonClose]} onPress={() => { setModalVisible(false); setEditModalVisible(false); setEditingProduct(null); }}>
                <Text style={styles.buttonTextSecondary}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.buttonOpen]} onPress={editingProduct ? handleEditProduct : handleAddProduct}>
                <Text style={styles.buttonTextPrimary}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};


// --- Pantalla de Nueva Venta ---
const NewSaleScreen = ({ navigation }) => {
    const { products, addSale } = useApp();
    const [cart, setCart] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);

    const handlePasteAndProcessOrder = async () => {
        setIsProcessing(true);
        try {
            const textFromClipboard = await Clipboard.getStringAsync();
            if (!textFromClipboard) {
                Alert.alert("Portapapeles vacío", "Primero copia el pedido de WhatsApp.");
                setIsProcessing(false);
                return;
            }
            const availableProducts = products.map(p => p.name);
            const prompt = `Eres un asistente de punto de venta. Analiza el siguiente texto de un pedido y extrae los productos y sus cantidades. Reglas: 1. Solo puedes devolver productos que existan en esta lista: [${availableProducts.join(", ")}]. 2. Ignora cualquier producto que no esté en la lista. 3. Ignora saludos, despedidas y cualquier otra conversación que no sea parte del pedido. 4. Tu respuesta DEBE ser únicamente un objeto JSON en formato de array, donde cada objeto contiene "productName" y "quantity". No incluyas texto adicional antes o después del JSON. Texto del pedido a analizar: "${textFromClipboard}"`;
            
            const apiKey = "AIzaSyDyhnDejCQiBvGCmw8iv75VvJkXYVONIl4"; // If you want to use models other than gemini-2.5-flash-preview-05-20, provide an API key here. Otherwise, leave this as-is.
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
            const payload = { contents: [{ parts: [{ text: prompt }] }] };

            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!response.ok) throw new Error(`Error de la API: ${response.statusText}`);

            const result = await response.json();
            if (result.candidates && result.candidates.length > 0) {
                const rawText = result.candidates[0].content.parts[0].text;
                const jsonText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
                const parsedOrder = JSON.parse(jsonText);
                let newCart = [...cart];
                parsedOrder.forEach(orderItem => {
                    const product = products.find(p => p.name.toLowerCase() === orderItem.productName.toLowerCase());
                    if (product) {
                        const existingCartItem = newCart.find(item => item.productId === product.id);
                        const quantityToAdd = orderItem.quantity;
                        if (existingCartItem) {
                            const newQuantity = existingCartItem.quantity + quantityToAdd;
                            if (newQuantity > product.stock) Alert.alert("Stock insuficiente", `No hay suficiente stock para ${product.name}. Stock: ${product.stock}`);
                            else existingCartItem.quantity = newQuantity;
                        } else {
                            if (quantityToAdd > product.stock) Alert.alert("Stock insuficiente", `No hay suficiente stock para ${product.name}. Stock: ${product.stock}`);
                            else newCart.push({ productId: product.id, name: product.name, quantity: quantityToAdd, price: product.sellingPrice, cost: product.costPrice, stock: product.stock });
                        }
                    }
                });
                setCart(newCart);
                Alert.alert("Pedido Procesado", "El carrito se ha llenado con los productos del mensaje. Por favor, verifica antes de confirmar.");
            } else {
                 throw new Error("La respuesta de la IA no tiene el formato esperado.");
            }
        } catch (error) {
            console.error("Error procesando el pedido:", error);
            Alert.alert("Error", "No se pudo procesar el pedido. Verifica tu conexión o el formato del texto.");
        } finally {
            setIsProcessing(false);
        }
    };

    const addToCart = (product) => {
        const existingItem = cart.find(item => item.productId === product.id);
        if (existingItem) {
            if (existingItem.quantity < product.stock) setCart(cart.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item));
            else Alert.alert("Stock insuficiente", `No puedes agregar más ${product.name}.`);
        } else {
            if (product.stock > 0) setCart([...cart, { productId: product.id, name: product.name, quantity: 1, price: product.sellingPrice, cost: product.costPrice, stock: product.stock }]);
            else Alert.alert("Sin stock", `El producto ${product.name} está agotado.`);
        }
    };

    const removeFromCart = (productId) => {
        const existingItem = cart.find(item => item.productId === productId);
        if (existingItem.quantity > 1) setCart(cart.map(item => item.productId === productId ? { ...item, quantity: item.quantity - 1 } : item));
        else setCart(cart.filter(item => item.productId !== productId));
    };

    const handleConfirmSale = () => {
        if (cart.length === 0) {
            Alert.alert("Carrito vacío", "Agrega productos para realizar una venta.");
            return;
        }
        const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const totalCost = cart.reduce((sum, item) => sum + item.cost * item.quantity, 0);
        const sale = { date: new Date().toISOString(), items: cart.map(({ productId, quantity, price }) => ({ productId, quantity, price })), total, profit: total - totalCost };
        addSale(sale);
        Alert.alert("Venta Realizada", `Total: $${total.toFixed(2)}`);
        navigation.goBack();
    };
    
    const totalVenta = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return (
        <SafeAreaView style={styles.container}>
            <TouchableOpacity style={styles.aiButton} onPress={handlePasteAndProcessOrder} disabled={isProcessing}>
                <Icon name="logo-whatsapp" size={20} color="#fff" />
                <Text style={styles.buttonTextPrimary}>Pegar y Procesar Pedido</Text>
            </TouchableOpacity>
            {isProcessing && <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: 10 }} />}
            
            <View style={{flex: 1}}>
              <Text style={styles.sectionTitle}>Productos</Text>
              <FlatList data={products.filter(p => p.stock > 0)} keyExtractor={item => item.id}
                  renderItem={({ item }) => (
                      <TouchableOpacity style={styles.productSaleItem} onPress={() => addToCart(item)}>
                          <Text style={styles.itemName}>{item.name} ({item.stock})</Text>
                          <Text style={styles.itemDetails}>${item.sellingPrice.toFixed(2)}</Text>
                      </TouchableOpacity>
                  )}
              />
            </View>
            <View style={styles.cartContainer}>
                <Text style={styles.sectionTitle}>Carrito</Text>
                <FlatList data={cart} keyExtractor={item => item.productId}
                    renderItem={({ item }) => (
                        <View style={styles.itemContainer}>
                            <View style={styles.itemInfo}>
                                <Text style={styles.itemName}>{item.name}</Text>
                                <Text style={styles.itemDetails}>${item.price.toFixed(2)} x {item.quantity} = ${(item.price * item.quantity).toFixed(2)}</Text>
                            </View>
                             <View style={styles.itemActions}>
                                 <TouchableOpacity onPress={() => addToCart({id: item.productId, stock: item.stock, name: item.name})} style={styles.iconButton}><Icon name="add-circle" size={28} color={COLORS.secondary} /></TouchableOpacity>
                                 <TouchableOpacity onPress={() => removeFromCart(item.productId)} style={styles.iconButton}><Icon name="remove-circle" size={28} color={COLORS.danger} /></TouchableOpacity>
                             </View>
                        </View>
                    )}
                    ListEmptyComponent={<Text style={styles.emptyText}>El carrito está vacío.</Text>}
                />
            </View>
            <View style={styles.footer}>
                <Text style={styles.totalText}>Total: ${totalVenta.toFixed(2)}</Text>
                <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmSale}>
                    <Text style={styles.buttonTextPrimary}>Confirmar Venta</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};


// --- Pantalla de Historial de Ventas ---
const HistoryScreen = () => {
    const { sales, deleteSale, products, clearSales } = useApp();

    const confirmDelete = (saleId) => {
        Alert.alert("Anular Venta", "¿Estás seguro de que quieres anular esta venta? El stock será devuelto.",
            [{ text: "Cancelar", style: "cancel" }, { text: "Anular Venta", onPress: () => deleteSale(saleId), style: "destructive" }]
        );
    };

    const handleExport = async () => {
      if (!(await Sharing.isAvailableAsync())) {
          Alert.alert('Error', 'La función de compartir no está disponible en tu dispositivo.');
          return;
      }
      try {
          const productsData = products.map(p => ({ ID: p.id, Nombre: p.name, Costo: p.costPrice, Precio_Venta: p.sellingPrice, Stock: p.stock }));
          const salesData = sales.map(s => {
              const itemsStr = s.items.map(item => {
                  const product = products.find(p => p.id === item.productId);
                  return `${product ? product.name : 'N/A'} (x${item.quantity})`;
              }).join(', ');
              return { ID_Venta: s.id, Fecha: new Date(s.date).toLocaleString(), Items: itemsStr, Total: s.total, Ganancia: s.profit };
          });
          const wsProducts = XLSX.utils.json_to_sheet(productsData);
          const wsSales = XLSX.utils.json_to_sheet(salesData);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, wsProducts, "Inventario");
          XLSX.utils.book_append_sheet(wb, wsSales, "Ventas");
          const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
          const nombreArchivo = `reporte_${new Date().toISOString().split('T')[0]}.xlsx`;
          const uri = FileSystem.cacheDirectory + nombreArchivo;
          await FileSystem.writeAsStringAsync(uri, wbout, { encoding: FileSystem.EncodingType.Base64 });
          await Sharing.shareAsync(uri, { mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', dialogTitle: 'Exportar Reporte de Ventas' });
          Alert.alert("Exportación Exitosa", "¿Deseas borrar las ventas del historial para comenzar un nuevo día?",
              [{ text: "No", style: "cancel" }, { text: "Sí, borrar", onPress: () => clearSales(), style: "destructive" }]
          );
      } catch (error) {
          console.error("Error al exportar:", error);
          Alert.alert("Error", "No se pudo generar el archivo Excel.");
      }
    };

    const renderItem = ({ item }) => {
        const soldItemsText = item.items.map(saleItem => {
            const product = products.find(p => p.id === saleItem.productId);
            return `${product ? product.name : 'Eliminado'} (x${saleItem.quantity})`;
        }).join(', ');
        return (
            <View style={styles.itemContainer}>
                <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>Venta - {new Date(item.date).toLocaleString()}</Text>
                    <Text style={styles.itemDetails}>Productos: {soldItemsText}</Text>
                    <Text style={styles.itemDetailsBold}>Total: ${item.total.toFixed(2)} | Ganancia: ${item.profit.toFixed(2)}</Text>
                </View>
                <TouchableOpacity onPress={() => confirmDelete(item.id)} style={styles.iconButton}>
                    <Icon name="trash-bin-outline" size={24} color={COLORS.danger} />
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <TouchableOpacity style={styles.exportButton} onPress={handleExport}>
                <Icon name="download-outline" size={20} color={COLORS.surface} />
                <Text style={styles.buttonTextPrimary}>Cerrar Día y Exportar a Excel</Text>
            </TouchableOpacity>
            <FlatList data={[...sales].reverse()} renderItem={renderItem} keyExtractor={item => item.id}
                contentContainerStyle={{ paddingHorizontal: 16 }}
                ListEmptyComponent={<Text style={styles.emptyText}>No hay ventas registradas.</Text>}
            />
        </SafeAreaView>
    );
};


// -------------------------------------------------------------------
// 3. NAVEGACIÓN Y APP PRINCIPAL
// -------------------------------------------------------------------
const Stack = createNativeStackNavigator();

export default function InventoryApp() {
  return (
    <AppProvider>
      <StatusBar barStyle="light-content" />
      {/* Se eliminó el NavigationContainer para compatibilidad con Expo Router */}
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: COLORS.primary },
          headerTintColor: COLORS.surface,
          headerTitleStyle: { fontWeight: 'bold' },
          headerShadowVisible: false, // Un look más plano y moderno
        }}
      >
        <Stack.Screen name="Resumen" component={HomeScreen} options={{ title: '  Gestion de ventas y control de stock' }} />
        <Stack.Screen name="Inventario" component={InventoryScreen} />
        <Stack.Screen name="Nueva Venta" component={NewSaleScreen} />
        <Stack.Screen name="Historial" component={HistoryScreen} options={{ title: 'Historial de Ventas' }} />
      </Stack.Navigator>
    </AppProvider>
  );
};

// -------------------------------------------------------------------
// 4. ESTILOS (Completamente renovados para un look moderno)
// -------------------------------------------------------------------
const styles = StyleSheet.create({
  // --- Contenedores y Layout ---
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { marginBottom: 24, alignItems: 'center' },
  headerTitle: { fontSize: 32, fontWeight: 'bold', color: COLORS.text_primary },
  headerSubtitle: { fontSize: 16, color: COLORS.text_secondary, marginTop: 4 },
  footer: { padding: 16, borderTopWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface },
  
  // --- Dashboard (HomeScreen) ---
  summaryGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  summaryBox: { 
    backgroundColor: COLORS.surface, 
    padding: 20, 
    borderRadius: 16, 
    alignItems: 'center', 
    width: '48%', 
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
  },
  summaryLabel: { fontSize: 14, color: COLORS.text_secondary, marginTop: 8 },
  summaryValue: { fontSize: 24, fontWeight: 'bold', color: COLORS.text_primary, marginTop: 4 },
  menuContainer: { marginTop: 16 },
  menuButton: { 
    backgroundColor: COLORS.primary, 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 20, 
    borderRadius: 12, 
    marginBottom: 12,
  },
  menuButtonText: { color: COLORS.surface, fontSize: 16, fontWeight: '600', marginLeft: 16 },
  
  // --- Listas y Tarjetas (Inventario, Historial) ---
  itemContainer: { 
    backgroundColor: COLORS.surface, 
    padding: 16, 
    marginVertical: 8, 
    borderRadius: 12, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  itemInfo: { flex: 1, marginRight: 12 },
  itemName: { fontSize: 16, fontWeight: '600', color: COLORS.text_primary },
  itemDetails: { fontSize: 14, color: COLORS.text_secondary, marginTop: 4 },
  itemDetailsBold: { fontSize: 14, color: COLORS.text_secondary, marginTop: 4, fontWeight: '500' },
  itemStockContainer: { alignItems: 'center', backgroundColor: COLORS.primary_light, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  itemStockText: { fontSize: 20, fontWeight: 'bold', color: COLORS.primary },
  
  // --- Botones ---
  fab: { position: 'absolute', right: 20, bottom: 20, backgroundColor: COLORS.primary, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4 },
  button: { borderRadius: 12, paddingVertical: 14, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  buttonOpen: { backgroundColor: COLORS.primary, flex: 1, marginLeft: 8 },
  buttonClose: { backgroundColor: COLORS.border, flex: 1, marginRight: 8 },
  buttonTextPrimary: { color: COLORS.surface, fontWeight: 'bold', fontSize: 16 },
  buttonTextSecondary: { color: COLORS.text_primary, fontWeight: 'bold', fontSize: 16 },
  confirmButton: { backgroundColor: COLORS.primary, padding: 16, borderRadius: 12, alignItems: 'center' },
  exportButton: { backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, margin: 16, borderRadius: 10, elevation: 2 },
  aiButton: { backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, margin: 16, borderRadius: 10, elevation: 2, gap: 8 },
  iconButton: { padding: 8 },
  
  // --- Modales e Inputs ---
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalView: { margin: 20, backgroundColor: COLORS.surface, borderRadius: 20, padding: 24, width: '90%', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, color: COLORS.text_primary, textAlign: 'center' },
  input: { backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border, padding: 14, borderRadius: 10, width: '100%', marginBottom: 16, fontSize: 16 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 10 },
  
  // --- Pantalla de Nueva Venta ---
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text_primary, paddingHorizontal: 16, paddingVertical: 12 },
  productSaleItem: { backgroundColor: COLORS.surface, padding: 16, marginHorizontal: 16, borderBottomWidth: 1, borderColor: COLORS.border, flexDirection: 'row', justifyContent: 'space-between' },
  cartContainer: { flex: 1, borderTopWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface },
  totalText: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 10, color: COLORS.text_primary },
  itemActions: { flexDirection: 'row', alignItems: 'center' },
  
  // --- Varios ---
  emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: COLORS.text_secondary },
});
