import { api } from "@/convex/_generated/api";
import useTheme from "@/hooks/useTheme";
import { useMutation, useQuery } from "convex/react";
import { Text, TouchableOpacity, View } from "react-native";

export default function Index() {
  const { toggleDarkMode } = useTheme();
  const todos = useQuery(api.todos.getTodos);
  const clearAllTodos = useMutation(api.todos.clearAllTodos);
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <TouchableOpacity onPress={toggleDarkMode}>
        <Text>toggle the mode</Text>
        {todos?.map((t) => (
          <Text>{t.text}</Text>
        ))}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => clearAllTodos()}>
        <Text>Clear All Todos</Text>
      </TouchableOpacity>
    </View>
  );
}
