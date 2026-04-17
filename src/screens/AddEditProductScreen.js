import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import {
  TextInput,
  Button,
  Title,
  ActivityIndicator,
  Switch,
  Paragraph,
  Chip,
  Menu,
  Divider,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { createProduct, updateProduct, getProduct } from '../services/woocommerce';

const AddEditProductScreen = ({ route, navigation }) => {
  const { productId } = route.params || {};
  const isEditing = !!productId;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    regular_price: '',
    description: '',
    short_description: '',
    stock_status: 'instock',
    manage_stock: false,
    stock_quantity: 0,
  });

  useEffect(() => {
    if (isEditing) {
      loadProduct();
    }
  }, []);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const product = await getProduct(productId);
      setFormData({
        name: product.name,
        regular_price: product.price,
        description: product.description.replace(/<[^>]*>/g, ''),
        short_description: product.short_description.replace(/<[^>]*>/g, ''),
        stock_status: product.stock_status,
        manage_stock: product.manage_stock,
        stock_quantity: product.stock_quantity || 0,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to load product');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.regular_price) {
      Alert.alert('Error', 'Please fill name and price');
      return;
    }

    const productData = {
      name: formData.name,
      regular_price: formData.regular_price.toString(),
      description: formData.description,
      short_description: formData.short_description,
      stock_status: formData.stock_status,
      manage_stock: formData.manage_stock,
      stock_quantity: formData.manage_stock ? parseInt(formData.stock_quantity) : 0,
    };

    try {
      setLoading(true);
      if (isEditing) {
        await updateProduct(productId, productData);
        Alert.alert('Success', 'Product updated successfully');
      } else {
        await createProduct(productData);
        Alert.alert('Success', 'Product created successfully');
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', `Failed to ${isEditing ? 'update' : 'create'} product`);
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditing) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.title}>
          {isEditing ? '✏️ Edit Product' : '✨ Add New Product'}
        </Title>
      </View>

      <TextInput
        label="Product Name *"
        value={formData.name}
        onChangeText={(text) => setFormData({ ...formData, name: text })}
        mode="outlined"
        style={styles.input}
        theme={{ colors: { primary: '#6200ee' } }}
        left={<TextInput.Icon icon="tag" />}
      />

      <TextInput
        label="Price * (₹)"
        value={formData.regular_price}
        onChangeText={(text) => setFormData({ ...formData, regular_price: text })}
        mode="outlined"
        keyboardType="numeric"
        style={styles.input}
        theme={{ colors: { primary: '#6200ee' } }}
        left={<TextInput.Icon icon="currency-inr" />}
      />

      <TextInput
        label="Short Description"
        value={formData.short_description}
        onChangeText={(text) => setFormData({ ...formData, short_description: text })}
        mode="outlined"
        multiline
        numberOfLines={3}
        style={styles.input}
        theme={{ colors: { primary: '#6200ee' } }}
        left={<TextInput.Icon icon="text" />}
      />

      <TextInput
        label="Full Description"
        value={formData.description}
        onChangeText={(text) => setFormData({ ...formData, description: text })}
        mode="outlined"
        multiline
        numberOfLines={5}
        style={styles.input}
        theme={{ colors: { primary: '#6200ee' } }}
        left={<TextInput.Icon icon="format-align-left" />}
      />

      <View style={styles.switchContainer}>
        <View style={styles.switchLabel}>
          <Ionicons name="cube" size={20} color="#6200ee" />
          <Paragraph style={styles.switchText}>Manage Stock?</Paragraph>
        </View>
        <Switch
          value={formData.manage_stock}
          onValueChange={(value) => setFormData({ ...formData, manage_stock: value })}
          color="#6200ee"
        />
      </View>

      {formData.manage_stock && (
        <TextInput
          label="Stock Quantity"
          value={formData.stock_quantity.toString()}
          onChangeText={(text) => setFormData({ ...formData, stock_quantity: text })}
          mode="outlined"
          keyboardType="numeric"
          style={styles.input}
          theme={{ colors: { primary: '#6200ee' } }}
          left={<TextInput.Icon icon="package-variant" />}
        />
      )}

      <View style={styles.stockStatusContainer}>
        <Paragraph style={styles.sectionLabel}>Stock Status:</Paragraph>
        <View style={styles.stockButtons}>
          <Chip
            selected={formData.stock_status === 'instock'}
            onPress={() => setFormData({ ...formData, stock_status: 'instock' })}
            style={formData.stock_status === 'instock' ? styles.chipSelected : styles.chip}
            icon="check-circle"
          >
            In Stock
          </Chip>
          <Chip
            selected={formData.stock_status === 'outofstock'}
            onPress={() => setFormData({ ...formData, stock_status: 'outofstock' })}
            style={formData.stock_status === 'outofstock' ? styles.chipSelected : styles.chip}
            icon="close-circle"
          >
            Out of Stock
          </Chip>
        </View>
      </View>

      <Button
        mode="contained"
        onPress={handleSubmit}
        loading={loading}
        style={styles.submitButton}
        contentStyle={styles.submitButtonContent}
        labelStyle={styles.submitButtonLabel}
      >
        {isEditing ? 'UPDATE PRODUCT' : 'CREATE PRODUCT'}
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#6200ee',
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  input: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 2,
  },
  switchLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  stockStatusContainer: {
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 2,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  stockButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  chip: {
    backgroundColor: '#f0f0f0',
  },
  chipSelected: {
    backgroundColor: '#6200ee',
  },
  submitButton: {
    marginHorizontal: 16,
    marginVertical: 20,
    paddingVertical: 4,
    borderRadius: 12,
    elevation: 3,
  },
  submitButtonContent: {
    height: 50,
  },
  submitButtonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});

export default AddEditProductScreen;